const sb=window.swaadSupabase;
let menu=[],cart=[],orders=[];
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statusLabel=s=>({NEW:'Order received',ACCEPTED:'Accepted',PREPARING:'Being prepared',READY:'Ready',COMPLETED:'Completed',CANCELLED:'Cancelled'}[s]||s);
const statusStep=s=>({NEW:1,ACCEPTED:2,PREPARING:3,READY:4,COMPLETED:5,CANCELLED:0}[s]||1);
async function loadMenu(){
 const r=await sb.from('menu_items').select('*').eq('available',true).order('category').order('name');
 const el=document.querySelector('#liveMenu'); if(!el)return;
 if(r.error){el.innerHTML='<p class="note">Menu is temporarily unavailable. Please call us.</p>';return}
 menu=r.data||[];
 el.innerHTML=menu.map(x=>'<article class="card"><div class="food-icon">'+(x.emoji||'🍽️')+'</div><h3>'+esc(x.name)+'</h3><p>'+esc(x.description||'Freshly prepared.')+'</p><b class="price">'+money(x.price)+'</b><br><button class="add" data-id="'+x.id+'">Add</button></article>').join('')||'<p>No items available right now.</p>';
 document.querySelectorAll('.add').forEach(b=>b.onclick=()=>add(b.dataset.id));
}
function add(id){const x=menu.find(m=>m.id===id);if(!x)return;const q=cart.find(i=>i.id===id);q?q.qty++:cart.push({id,qty:1,...x});renderCart()}
function change(id,n){const q=cart.find(i=>i.id===id);if(!q)return;q.qty+=n;if(q.qty<1)cart=cart.filter(i=>i.id!==id);renderCart()}
function renderCart(){
 const box=document.querySelector('#cart');if(!box)return;
 const total=cart.reduce((s,x)=>s+x.qty*x.price,0);
 box.innerHTML=cart.length?cart.map(x=>'<div class="cart-row"><span>'+esc(x.name)+' × '+x.qty+'</span><span>'+money(x.qty*x.price)+' <button onclick="change(\''+x.id+'\',-1)">−</button><button onclick="change(\''+x.id+'\',1)">+</button></span></div>').join('')+
 '<div class="cart-total"><span>Total</span><b>'+money(total)+'</b></div><button id="placeOrder" class="btn">Continue to checkout</button>':'<p>Your cart is empty.</p>';
 document.querySelector('#placeOrder')?.addEventListener('click',checkout);
}
function showModal(html){let m=document.querySelector('#ssModal');if(!m){m=document.createElement('div');m.id='ssModal';m.className='modal';document.body.appendChild(m)}m.innerHTML='<div class="modal-card">'+html+'</div>';m.hidden=false;m.onclick=e=>{if(e.target===m)m.hidden=true}}
function closeModal(){const m=document.querySelector('#ssModal');if(m)m.hidden=true}
async function checkout(){
 const s=await sb.auth.getSession(),u=s.data.session?.user;
 if(!u){location.href='auth.html?next=checkout';return}
 const phone=u.phone||'',profile=await sb.from('profiles').select('full_name,phone').eq('id',u.id).maybeSingle(),name=profile.data?.full_name||u.user_metadata?.full_name||'';
 showModal('<button class="modal-x" onclick="closeModal()">×</button><p class="ey">CHECKOUT</p><h2>Almost there</h2><label>Name<input id="checkoutName" value="'+esc(name)+'" placeholder="Your name"></label><label>Mobile<input value="'+esc(phone||'')+'" disabled></label><label>Order type<select id="checkoutMode"><option value="TAKEAWAY">Takeaway</option><option value="DINE_IN">Dine-in</option><option value="DELIVERY">Delivery</option></select></label><label>Notes (optional)<textarea id="checkoutNotes" placeholder="Table number, delivery note, etc."></textarea></label><button class="btn" id="confirmOrder">Place order · '+money(cart.reduce((s,x)=>s+x.qty*x.price,0))+'</button><p id="checkoutMsg" class="note"></p>');
 document.querySelector('#confirmOrder').onclick=()=>submitOrder(u.id,phone);
}
async function submitOrder(uid,phone){
 const name=document.querySelector('#checkoutName').value.trim(),mode=document.querySelector('#checkoutMode').value,notes=document.querySelector('#checkoutNotes').value.trim(),msg=document.querySelector('#checkoutMsg');
 if(!name)return msg.textContent='Please enter your name.';
 if(!phone)return msg.textContent='Your verified phone number is missing. Please sign in again.';
 const total=cart.reduce((s,x)=>s+x.qty*x.price,0),number='SS-'+Date.now().toString().slice(-8);
 document.querySelector('#confirmOrder').disabled=true;msg.textContent='Placing your order…';
 const p=await sb.from('profiles').update({full_name:name,phone}).eq('id',uid);
 if(p.error){msg.textContent=p.error.message;document.querySelector('#confirmOrder').disabled=false;return}
 const o=await sb.from('orders').insert({order_number:number,customer_id:uid,customer_name:name,phone,order_mode:mode,subtotal:total,total,notes}).select().single();
 if(o.error){msg.textContent=o.error.message;document.querySelector('#confirmOrder').disabled=false;return}
 const r=await sb.from('order_items').insert(cart.map(x=>({order_id:o.data.id,menu_item_id:x.id,item_name:x.name,quantity:x.qty,unit_price:x.price})));
 if(r.error){await sb.from('orders').update({status:'CANCELLED'}).eq('id',o.data.id);msg.textContent=r.error.message;document.querySelector('#confirmOrder').disabled=false;return}
 cart=[];renderCart();closeModal();showOrderConfirmation(o.data);loadOrders();
}
function showOrderConfirmation(o){showModal('<button class="modal-x" onclick="closeModal()">×</button><div class="success">✓</div><p class="ey">ORDER CONFIRMED</p><h2>#'+esc(o.order_number)+'</h2><p class="muted">We received your '+esc(o.order_mode.toLowerCase().replace('_',' '))+' order.</p><div class="confirm-total"><span>Total</span><b>'+money(o.total)+'</b></div><button class="btn" onclick="openOrders()">Track my order</button><a class="btn ghost full" href="https://wa.me/918296064418?text='+encodeURIComponent('Hello Swaad Sadan, I placed order #'+o.order_number+'.')+'" target="_blank">WhatsApp hotel</a></div>')}
async function loadOrders(){
 const s=await sb.auth.getSession(),u=s.data.session?.user;if(!u){orders=[];return}
 const r=await sb.from('orders').select('*,order_items(*)').eq('customer_id',u.id).order('created_at',{ascending:false}).limit(30);
 if(!r.error)orders=r.data||[];
}
function orderCard(o){
 const step=statusStep(o.status),steps=['Received','Accepted','Preparing','Ready','Completed'];
 return '<article class="history-card"><div class="history-head"><b>#'+esc(o.order_number)+'</b><span>'+money(o.total)+'</span></div><div class="muted">'+new Date(o.created_at).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})+' · '+esc(o.order_mode)+'</div><div class="tracker">'+steps.map((x,i)=>'<div class="'+(i<step?'on':'')+'"><i>'+((i+1)<=step?'✓':i+1)+'</i><small>'+x+'</small></div>').join('')+'</div><b>'+esc(statusLabel(o.status))+'</b><div class="items">'+(o.order_items||[]).map(i=>esc(i.item_name)+' × '+i.quantity).join(' · ')+'</div></article>';
}
function openOrders(){
 closeModal();showModal('<button class="modal-x" onclick="closeModal()">×</button><p class="ey">MY ORDERS</p><h2>Order history</h2><div id="historyList">'+(orders.length?orders.map(orderCard).join(''):'<p class="note">No orders yet.</p>')+'</div>');
}
async function authUI(){
 const r=await sb.auth.getSession(),u=r.data.session?.user,a=document.querySelector('#account');if(!a)return;
 if(u){await loadOrders();a.textContent='My orders';a.onclick=async e=>{e.preventDefault();openOrders()};}
 else a.textContent='Sign in';
}
function startRealtime(){
 sb.channel('customer-orders').on('postgres_changes',{event:'*',schema:'public',table:'orders'},async payload=>{
  const s=await sb.auth.getSession(),u=s.data.session?.user;if(u&&payload.new?.customer_id===u.id){await loadOrders();const m=document.querySelector('#ssModal');if(m&&!m.hidden){const list=document.querySelector('#historyList');if(list)list.innerHTML=orders.map(orderCard).join('')}}}).subscribe();
}
window.add=add;window.change=change;window.closeModal=closeModal;window.openOrders=openOrders;
document.addEventListener('DOMContentLoaded',()=>{loadMenu();renderCart();authUI();startRealtime()});
