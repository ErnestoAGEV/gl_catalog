(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))i(t);new MutationObserver(t=>{for(const o of t)if(o.type==="childList")for(const s of o.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&i(s)}).observe(document,{childList:!0,subtree:!0});function a(t){const o={};return t.integrity&&(o.integrity=t.integrity),t.referrerPolicy&&(o.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?o.credentials="include":t.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(t){if(t.ep)return;t.ep=!0;const o=a(t);fetch(t.href,o)}})();const X={name:"G&L",whatsapp:"523121018263",freeShippingMin:999},Ae="523121018263",L={products:"gl_products",cart:"gl_cart",adminSession:"gl_admin_session",wishlist:"gl_wishlist",theme:"gl_theme",coupon:"gl_coupon",newsletter:"gl_newsletter"},Ne={WELCOME10:{discount:.1,label:"10% de descuento"},VERANO20:{discount:.2,label:"20% de descuento"},ENVIOGRATIS:{discount:0,freeShipping:!0,label:"Envío gratis"}},ye={user:"admin",pass:"admin123"};function _(e,r){try{const a=localStorage.getItem(e);return a?JSON.parse(a):r}catch{return r}}function O(e,r){localStorage.setItem(e,JSON.stringify(r))}const $={camisas:["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=750&fit=crop","https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=750&fit=crop"],playeras:["https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop","https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop"],pantalones:["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=750&fit=crop","https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop"],sudaderas:["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=750&fit=crop","https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=600&h=750&fit=crop"],chamarras:["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=750&fit=crop","https://images.unsplash.com/photo-1559551409-dadc959f76b8?w=600&h=750&fit=crop"],perfumes:["https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&h=750&fit=crop","https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=750&fit=crop"],general:["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=750&fit=crop","https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=750&fit=crop"]},qe=[{id:"p-oxford-01",name:"Camisa Oxford",type:"Camisas",price:799,originalPrice:999,colors:["Negro","Blanco","Azul Marino"],sizes:["S","M","L","XL"],badge:"Oferta",stock:8,rating:4.8,reviews:24,images:$.camisas},{id:"p-poplin-01",name:"Camisa Popelina Slim",type:"Camisas",price:849,originalPrice:null,colors:["Blanco","Azul Cielo","Negro"],sizes:["S","M","L","XL"],badge:"Nuevo",stock:15,rating:4.5,reviews:12,images:$.camisas},{id:"p-tee-01",name:"Playera Básica Premium",type:"Playeras",price:299,originalPrice:null,colors:["Negro","Blanco","Gris","Verde Olivo"],sizes:["S","M","L","XL","XXL"],badge:"Popular",stock:50,rating:4.9,reviews:89,images:$.playeras},{id:"p-tee-02",name:"Playera Oversize",type:"Playeras",price:349,originalPrice:449,colors:["Negro","Blanco","Arena"],sizes:["S","M","L","XL"],badge:"Oferta",stock:3,rating:4.6,reviews:31,images:$.playeras},{id:"p-polo-01",name:"Polo Piqué",type:"Polos",price:549,originalPrice:null,colors:["Negro","Azul Marino","Blanco"],sizes:["S","M","L","XL"],badge:null,stock:20,rating:4.7,reviews:18,images:$.general},{id:"p-jean-01",name:"Jeans Slim",type:"Pantalones",price:1099,originalPrice:1299,colors:["Azul","Negro"],sizes:["30","32","34","36","38"],badge:"Oferta",stock:12,rating:4.8,reviews:45,images:$.pantalones},{id:"p-jean-02",name:"Jeans Regular",type:"Pantalones",price:999,originalPrice:null,colors:["Azul Oscuro","Negro"],sizes:["30","32","34","36","38"],badge:null,stock:25,rating:4.4,reviews:22,images:$.pantalones},{id:"p-chino-01",name:"Pantalón Chino",type:"Pantalones",price:949,originalPrice:null,colors:["Negro","Beige","Verde Olivo"],sizes:["30","32","34","36","38"],badge:"Nuevo",stock:18,rating:4.6,reviews:15,images:$.pantalones},{id:"p-bermuda-01",name:"Short Chino",type:"Shorts",price:699,originalPrice:null,colors:["Negro","Beige"],sizes:["30","32","34","36"],badge:null,stock:10,rating:4.3,reviews:8,images:$.general},{id:"p-hoodie-01",name:"Sudadera Hoodie Minimal",type:"Sudaderas",price:899,originalPrice:1099,colors:["Negro","Gris"],sizes:["S","M","L","XL"],badge:"Popular",stock:6,rating:4.9,reviews:67,images:$.sudaderas},{id:"p-crewneck-01",name:"Sudadera Crewneck",type:"Sudaderas",price:849,originalPrice:null,colors:["Negro","Gris","Azul Marino"],sizes:["S","M","L","XL"],badge:null,stock:14,rating:4.5,reviews:19,images:$.sudaderas},{id:"p-sweater-01",name:"Suéter Tejido Fino",type:"Suéteres",price:899,originalPrice:null,colors:["Negro","Gris","Bordó"],sizes:["S","M","L","XL"],badge:"Nuevo",stock:9,rating:4.7,reviews:11,images:$.general},{id:"p-jacket-01",name:"Chamarra Urban",type:"Chamarras",price:1699,originalPrice:null,colors:["Negro"],sizes:["M","L","XL"],badge:null,stock:2,rating:4.8,reviews:28,images:$.chamarras},{id:"p-jacket-02",name:"Chamarra Bomber",type:"Chamarras",price:1899,originalPrice:2299,colors:["Negro","Verde Olivo"],sizes:["S","M","L","XL"],badge:"Oferta",stock:4,rating:4.9,reviews:52,images:$.chamarras},{id:"p-coat-01",name:"Abrigo de Paño",type:"Abrigos",price:2999,originalPrice:null,colors:["Negro","Gris"],sizes:["M","L","XL"],badge:"Premium",stock:5,rating:5,reviews:14,images:$.chamarras},{id:"p-perfume-01",name:"Perfume Intense Noir",type:"Perfumes",price:1299,originalPrice:1599,colors:["100ml","50ml"],sizes:["100ml","50ml"],badge:"Oferta",stock:12,rating:4.9,reviews:45,images:$.perfumes},{id:"p-perfume-02",name:"Perfume Fresh Ocean",type:"Perfumes",price:999,originalPrice:null,colors:["100ml","50ml"],sizes:["100ml","50ml"],badge:"Nuevo",stock:20,rating:4.7,reviews:32,images:$.perfumes},{id:"p-perfume-03",name:"Perfume Classic Wood",type:"Perfumes",price:1499,originalPrice:null,colors:["100ml"],sizes:["100ml"],badge:"Premium",stock:8,rating:5,reviews:28,images:$.perfumes},{id:"p-perfume-04",name:"Perfume Sport Energy",type:"Perfumes",price:799,originalPrice:999,colors:["100ml","50ml"],sizes:["100ml","50ml"],badge:"Popular",stock:25,rating:4.8,reviews:67,images:$.perfumes}],we=3;function Ie(){const e=localStorage.getItem("gl_seed_version"),r=_(L.products,null);(e!==String(we)||!Array.isArray(r)||r.length===0)&&(O(L.products,qe),localStorage.setItem("gl_seed_version",String(we)))}const ie=new Set;function K(){const e=window.location.hash||"#/";return(e.startsWith("#")?e.slice(1):e)||"/"}function U(e){const r=e.startsWith("/")?e:`/${e}`;window.location.hash=`#${r}`}function Te(e){return ie.add(e),()=>ie.delete(e)}function Oe(){const e=()=>{for(const r of ie)r(K())};return window.addEventListener("hashchange",e),e(),()=>{window.removeEventListener("hashchange",e)}}const le=new Set,p={products:_(L.products,[]),cart:_(L.cart,[]),adminSession:_(L.adminSession,null),wishlist:_(L.wishlist,[]),theme:"light",coupon:_(L.coupon,null),newsletter:_(L.newsletter,null),searchQuery:""};function N(){for(const e of le)e(de())}function He(e){return le.add(e),()=>le.delete(e)}function de(){return structuredClone(p)}function Re(){p.products=_(L.products,[]),N()}function ke(e){p.products=e,O(L.products,e),N()}function ce(e){return p.products.find(r=>r.id===e)||null}function Ce({productId:e,size:r,color:a,qty:i}){const t=Math.max(1,Number(i)),o=`${e}__${r||""}__${a||""}`,s=p.cart.find(n=>n.key===o);s?s.qty+=t:p.cart.push({key:o,productId:e,size:r||"",color:a||"",qty:t}),O(L.cart,p.cart),N()}function se(e,r){const a=p.cart.find(i=>i.key===e);a&&(a.qty=Math.max(1,Number(r||1)),O(L.cart,p.cart),N())}function De(e){p.cart=p.cart.filter(r=>r.key!==e),O(L.cart,p.cart),N()}function oe(){return p.cart.reduce((e,r)=>{const a=ce(r.productId),i=(a==null?void 0:a.price)||0;return e+i*(Number(r.qty)||0)},0)}function Ve(){return!!(p.adminSession&&p.adminSession.ok)}function _e(e,r){const a=e===ye.user&&r===ye.pass;return p.adminSession=a?{ok:!0,at:Date.now()}:null,O(L.adminSession,p.adminSession),N(),a}function Ge(){p.adminSession=null,O(L.adminSession,null),N()}function Fe(){return p.theme}function Ue(){return p.theme=p.theme==="dark"?"light":"dark",O(L.theme,p.theme),N(),p.theme}function Me(e,r=!1){const a=e.toUpperCase().trim(),i=Ne[a];return i?(p.coupon={code:a,...i},O(L.coupon,p.coupon),r||N(),{success:!0,coupon:p.coupon}):{success:!1,error:"Cupón no válido"}}function $e(e=!1){p.coupon=null,O(L.coupon,null),e||N()}function re(){return p.coupon}function We(e){return p.newsletter={email:e,subscribedAt:Date.now()},O(L.newsletter,p.newsletter),N(),!0}function Xe(){var e;return!!((e=p.newsletter)!=null&&e.email)}function Y(e){p.searchQuery=e,N()}function je(){return p.searchQuery}function Qe(e){const r=e.toLowerCase().trim();return r?p.products.filter(a=>a.name.toLowerCase().includes(r)||a.type.toLowerCase().includes(r)||a.colors.some(i=>i.toLowerCase().includes(r))):p.products}function Je(e,r="dark"){return`<div class="min-h-dvh overflow-x-hidden ${r==="dark"?"bg-black text-white":"bg-white text-gray-900"}">
    ${e}
  </div>`}function Ke({contentHtml:e,state:r,showSearch:a=!1}){const i=(r.cart||[]).reduce((n,c)=>n+(Number(c.qty)||0),0),t=r.theme||"dark",o=t==="dark",s=a?`
      <!-- Search Bar -->
      <div class="mx-auto w-full max-w-screen-sm px-4 pt-3">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${o?"text-gray-500":"text-gray-400"}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input 
            type="search" 
            id="global-search"
            placeholder="Buscar productos..." 
            value="${je()||""}"
            class="w-full pl-10 pr-4 py-2.5 rounded-full ${o?"bg-gray-900 border-gray-800 text-white placeholder:text-gray-500":"bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400"} border text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
        </div>
      </div>
  `:"";return Je(`
    <!-- Free Shipping Banner -->
    <div class="bg-brand text-white text-center py-2 px-4">
      <p class="text-xs font-medium flex items-center justify-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
        </svg>
        <span>Envío GRATIS en compras +$${X.freeShippingMin} MXN</span>
      </p>
    </div>

    <header class="sticky top-0 z-30 ${o?"bg-black/95":"bg-white/95"} backdrop-blur-lg border-b ${o?"border-gray-800/50":"border-gray-200"}">
      ${s}
      <!-- Navigation -->
      <div class="mx-auto flex w-full max-w-screen-sm items-center justify-between px-4 py-3">
        <a href="#/" class="flex items-center gap-2">
          <img src="logo.png" alt="G&L" class="h-10 w-auto object-contain" />
        </a>
        <nav class="flex items-center gap-3">
          <a class="text-sm ${o?"text-gray-300 hover:text-white":"text-gray-600 hover:text-gray-900"} transition-colors" href="#/catalog">
            Tienda
          </a>

          <!-- Cart -->
          <a class="relative p-1.5 ${o?"text-gray-300 hover:text-white":"text-gray-600 hover:text-gray-900"} transition-colors" href="#/cart" title="Carrito">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            ${i>0?`<span class="absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">${i}</span>`:""}
          </a>
          </a>

          <!-- Theme Toggle -->
          <button id="theme-toggle" class="p-1.5 ${o?"text-gray-300 hover:text-white":"text-gray-600 hover:text-gray-900"} transition-colors" title="Cambiar tema">
            ${o?'<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>':'<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>'}
          </button>
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg px-4 py-5 pb-24 overflow-x-hidden">
      ${e}
    </main>

    <footer class="${o?"bg-gray-950 border-gray-800/50":"bg-gray-100 border-gray-200"} border-t">
      <div class="mx-auto w-full max-w-screen-sm px-4 py-8">
        <div class="flex flex-col items-center text-center">
          <span class="text-lg font-bold ${o?"text-white":"text-gray-900"} mb-2">G&L</span>
          <p class="text-xs ${o?"text-gray-500":"text-gray-600"} mb-4">Moda masculina · Colima, México</p>
          
          <div class="flex items-center gap-4 mb-6">
            <a href="https://wa.me/${X.whatsapp}" target="_blank" class="w-10 h-10 rounded-full ${o?"bg-gray-800 hover:bg-gray-700":"bg-gray-200 hover:bg-gray-300"} flex items-center justify-center transition-colors">
              <svg class="w-5 h-5 ${o?"text-white":"text-gray-700"}" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" class="w-10 h-10 rounded-full ${o?"bg-gray-800 hover:bg-gray-700":"bg-gray-200 hover:bg-gray-300"} flex items-center justify-center transition-colors">
              <svg class="w-5 h-5 ${o?"text-white":"text-gray-700"}" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>

          <div class="flex flex-wrap justify-center gap-4 mb-4 text-xs ${o?"text-gray-500":"text-gray-600"}">
            <a href="#/catalog" class="hover:underline">Catálogo</a>
            <a href="#/cart" class="hover:underline">Carrito</a>
            <a href="https://wa.me/${X.whatsapp}" target="_blank" class="hover:underline">Contacto</a>
          </div>

          <div class="text-xs ${o?"text-gray-600":"text-gray-500"}">
            © 2026 ${X.name}. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </footer>
  `,t)}function Ye({contentHtml:e,state:r}){var i;return`<div class="min-h-dvh overflow-x-hidden bg-gray-50 text-gray-900">
    <header class="sticky top-0 z-30 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div class="mx-auto flex w-full max-w-screen-sm items-center justify-between px-4 py-3">
        <div class="flex items-center gap-2">
          <span class="text-lg font-bold text-gray-900">G&L</span>
          <span class="text-xs px-2 py-0.5 rounded bg-brand/10 text-brand font-medium">Admin</span>
        </div>
        ${!!((i=r==null?void 0:r.adminSession)!=null&&i.ok)?`<button id="admin-logout" class="text-sm text-gray-500 hover:text-brand transition-colors">
                Salir
              </button>`:""}
      </div>
    </header>

    <main class="mx-auto w-full max-w-screen-sm px-4 py-5">
      ${e}
    </main>
  </div>`}function k(e){return Number(e||0).toLocaleString("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0})}function l(e,r){const a=e.querySelector(r);if(!a)throw new Error(`Missing element: ${r}`);return a}function T(e,r,a,i){e.addEventListener(r,t=>{const o=t.target;if(!(o instanceof Element))return;const s=o.closest(a);!s||!e.contains(s)||i(t,s)})}const ae=[{image:"https://images.unsplash.com/photo-1507680434567-5739c80be1ac?w=800&h=600&fit=crop",badge:"NUEVA COLECCIÓN 2026",title:"Estilo<br/>sin esfuerzo",subtitle:"Descubre tu estilo con nosotros.",accent:"from-blue-600/30"},{image:"https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=800&h=600&fit=crop",badge:"OFERTAS ESPECIALES",title:"Hasta 30%<br/>de descuento",subtitle:"En prendas seleccionadas. Por tiempo limitado.",accent:"from-red-600/30"},{image:"https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=800&h=600&fit=crop",badge:"TEMPORADA",title:"Lo mejor<br/>del invierno",subtitle:"Chamarras, sudaderas y más.",accent:"from-purple-600/30"}],Ze=[{name:"Carlos M.",rating:5,text:"Excelente calidad en las playeras. Ya es mi tercera compra.",avatar:"https://randomuser.me/api/portraits/men/32.jpg"},{name:"Roberto G.",rating:5,text:"El envío fue rapidísimo y la atención por WhatsApp muy buena.",avatar:"https://randomuser.me/api/portraits/men/44.jpg"},{name:"Miguel A.",rating:4,text:"Los pantalones quedaron perfectos. Muy recomendado.",avatar:"https://randomuser.me/api/portraits/men/22.jpg"}],et=["https://images.unsplash.com/photo-1617137968427-85924c800a22?w=300&h=300&fit=crop","https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=300&h=300&fit=crop","https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop","https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=300&h=300&fit=crop"];function tt(e){return{Nuevo:"bg-blue-500",Oferta:"bg-red-500",Popular:"bg-amber-500",Premium:"bg-purple-500"}[e]||"bg-gray-700"}function rt(e){const r=Math.floor(e),a=e%1>=.5;let i="";for(let t=0;t<5;t++)t<r?i+='<svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>':t===r&&a?i+='<svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" opacity="0.5"/></svg>':i+='<svg class="w-3.5 h-3.5 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';return i}function Le(e,r){var i;const a=((i=e.images)==null?void 0:i[0])||"https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop";return`
    <article class="group relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in h-full flex flex-col" style="animation-delay: ${r*50}ms">
      <a href="#/catalog" class="block relative aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img 
          src="${a}" 
          alt="${e.name}"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        
        <!-- Badges -->
        <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
          ${e.badge?`<span class="inline-flex px-2.5 py-1 text-[10px] font-bold tracking-wider ${tt(e.badge)} text-white uppercase rounded-md shadow-sm">${e.badge}</span>`:""}
          ${e.stock<=5&&e.stock>0?'<span class="inline-flex px-2.5 py-1 text-[10px] font-bold tracking-wider bg-orange-500 text-white uppercase rounded-md shadow-sm">¡Últimas piezas!</span>':""}
        </div>
      </a>
      
      <div class="p-4 flex flex-col flex-grow">
        
        <h3 class="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-brand transition-colors">${e.name}</h3>
        
        <div class="mt-auto pt-2">
            <div class="flex items-baseline flex-wrap gap-x-2 gap-y-1">
              <p class="text-lg font-black text-gray-900 dark:text-white">${k(e.price)}</p>
              ${e.originalPrice?`<p class="text-sm text-gray-400 line-through">${k(e.originalPrice)}</p>`:""}
              ${e.originalPrice?`<span class="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded">-${Math.round((1-e.price/e.originalPrice)*100)}%</span>`:""}
            </div>
        </div>
      </div>
    </article>
  `}function Pe(){const e=de();[...e.products].slice(0,4);const r=[...e.products].sort((t,o)=>(o.reviews||0)-(t.reviews||0)).slice(0,4),a=e.products.filter(t=>t.badge==="Nuevo").slice(0,4),i=Xe();return{title:`${X.name} | Men´s Cloting`,html:`
      <!-- Hero Section - Redesigned -->
      <section class="relative mb-8">
        <div class="relative h-[65vh] min-h-[500px] w-full overflow-hidden rounded-2xl">
            <img 
              src="${ae[0].image}"
              alt="Nueva Colección"
              class="absolute inset-0 w-full h-full object-cover object-center animate-fade-in"
            />
            <div class="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/60 to-transparent"></div>
            <div class="absolute inset-0 flex items-center p-6 md:p-12">
              <div class="max-w-lg space-y-6 animate-slide-up">
                 <span class="inline-block px-3 py-1 bg-brand text-white text-xs font-bold tracking-[0.2em] uppercase rounded shadow-lg shadow-brand/20 backdrop-blur-sm">
                  ${ae[0].badge}
                </span>
                <h1 class="text-5xl md:text-7xl font-black text-white leading-[1.1] drop-shadow-xl">
                  ${ae[0].title}
                </h1>
                <p class="text-lg text-gray-200 font-medium leading-relaxed drop-shadow-md border-l-4 border-brand pl-4">
                   ${ae[0].subtitle}
                </p>
                
                <div class="pt-4">
                  <a href="#/catalog" class="group inline-flex items-center gap-3 px-8 py-4 bg-brand text-white text-sm font-bold rounded-full hover:bg-brand-dark transition-all shadow-lg shadow-brand/40 hover:shadow-brand/60 hover:-translate-y-1">
                    Ver colección
                    <svg class="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                  </a>
                </div>
              </div>
            </div>
        </div>
      </section>



      <!-- Quick Shop Categories -->
      <section class="mb-16">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Explora por categoría</h2>
          <a href="#/catalog" class="group text-sm font-medium text-brand hover:text-brand-dark transition-colors inline-flex items-center gap-1">
            Ver todo
            <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </a>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <!-- Camisas -->
          <a href="#/catalog" class="relative aspect-[3/4] rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500 block">
            <img src="https://i.pinimg.com/736x/f0/cc/e5/f0cce55c3da63f81343dd530422c7558.jpg" alt="Camisas" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>
            <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <span class="inline-block px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-3 border border-white/20 shadow-sm">Casual</span>
              <h3 class="text-xl md:text-2xl font-black text-white mb-2 leading-tight drop-shadow-lg">Camisas</h3>
              <p class="text-gray-200 text-xs font-medium max-w-[160px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 translate-y-2 group-hover:translate-y-0">Estilo y confort para cualquier ocasión.</p>
            </div>
          </a>
          
          <!-- Playeras -->
          <a href="#/catalog" class="relative aspect-[3/4] rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500 block">
            <img src="https://i.pinimg.com/736x/9d/b5/3a/9db53ac193e070ec32bfc55102d5cadb.jpg" alt="Playeras" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>
             <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <span class="inline-block px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-3 border border-white/20 shadow-sm">Básicos</span>
              <h3 class="text-xl md:text-2xl font-black text-white mb-2 leading-tight drop-shadow-lg">Playeras</h3>
              <p class="text-gray-200 text-xs font-medium max-w-[160px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 translate-y-2 group-hover:translate-y-0">Algodón pima de alta calidad.</p>
            </div>
          </a>
          
          <!-- Pantalones -->
          <a href="#/catalog" class="relative aspect-[3/4] rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500 block">
            <img src="https://i.pinimg.com/736x/8a/e5/6c/8ae56c59aba6c6a1f88e579b133a0104.jpg" alt="Pantalones" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>
             <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <span class="inline-block px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-3 border border-white/20 shadow-sm">Denim</span>
              <h3 class="text-xl md:text-2xl font-black text-white mb-2 leading-tight drop-shadow-lg">Jeans & Chinos</h3>
              <p class="text-gray-200 text-xs font-medium max-w-[160px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 translate-y-2 group-hover:translate-y-0">Corte perfecto y durabilidad.</p>
            </div>
          </a>

          <!-- Perfumes -->
          <a href="#/catalog" class="relative aspect-[3/4] rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500 block">
            <img src="https://i.pinimg.com/736x/2c/f3/45/2cf345c33502c764d0a39389f18fce93.jpg" alt="Perfumes" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>
             <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <span class="inline-block px-3 py-1 bg-white/10 backdrop-blur rounded-full text-[10px] font-bold text-white uppercase tracking-widest mb-3 border border-white/20 shadow-sm">Fragancias</span>
              <h3 class="text-xl md:text-2xl font-black text-white mb-2 leading-tight drop-shadow-lg">Perfumes</h3>
              <p class="text-gray-200 text-xs font-medium max-w-[160px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 translate-y-2 group-hover:translate-y-0">Las mejores fragancias para él.</p>
            </div>
          </a>
        </div>
      </section>

      <!-- Best Sellers - Grid -->
      <section class="mb-16">
        <div class="flex items-end justify-between mb-8">
          <div>
            <span class="inline-flex items-center gap-1.5 text-xs font-bold text-brand uppercase tracking-widest mb-2">
              <span class="w-1.5 h-1.5 rounded-full bg-brand"></span>
              Favoritos
            </span>
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Lo más vendido</h2>
          </div>
          <a href="#/catalog" class="hidden md:flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
            Ver catálogo
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          ${r.map((t,o)=>Le(t,o)).join("")}
        </div>
        
         <div class="mt-8 text-center md:hidden">
            <a href="#/catalog" class="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-200 transition-colors">
                Ver más productos
            </a>
        </div>
      </section>

      <!-- Promo Banner -->
      <section class="mb-16 relative rounded-[2rem] overflow-hidden shadow-2xl group min-h-[18rem] md:min-h-[20rem] flex items-center">
        <img 
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop"
          alt="Promo"
          class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent"></div>
        <div class="relative z-10 w-full p-6 md:p-12">
          <div class="max-w-md animate-slide-up">
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-brand text-white rounded-full mb-4 shadow-lg shadow-brand/20">
              <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              <span class="text-[10px] font-black uppercase tracking-wider">Oferta Exclusiva</span>
            </div>
            
            <h2 class="text-3xl md:text-5xl font-black text-white leading-tight mb-2">10% OFF</h2>
            <p class="text-base md:text-lg text-gray-200 mb-6 font-medium">Obtén un descuento especial en tu primera compra.</p>
            
            <div class="flex flex-col sm:flex-row items-start gap-3 w-full sm:w-auto">
              <div class="relative group/code w-full sm:w-auto">
                 <code class="block px-6 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white font-mono text-lg tracking-widest text-center">WELCOME10</code>
                 <button id="copy-coupon" class="absolute inset-0 w-full h-full flex items-center justify-center bg-brand/90 opacity-0 group-hover/code:opacity-100 transition-opacity rounded-xl cursor-copy text-white font-bold text-xs gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    Copiar
                 </button>
              </div>
              <a href="#/catalog" class="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-colors w-full sm:w-auto">
                Usar cupón
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- New Arrivals -->
      ${a.length>0?`
      <section class="mb-16">
        <div class="flex items-center justify-between mb-8">
           <div>
            <span class="inline-flex items-center gap-1.5 text-xs font-bold text-blue-500 uppercase tracking-widest mb-2">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Recién llegados
            </span>
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Recien Llegados</h2>
          </div>
          <a href="#/catalog" class="hidden md:flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
            Ver todo
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 stagger-children">
          ${a.map((t,o)=>Le(t,o)).join("")}
        </div>
      </section>
      `:""}

      <!-- Features / Trust Section -->
      <section class="mb-12 border-y border-gray-100 dark:border-gray-800 py-10">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-4">
          <!-- WhatsApp -->
          <div class="flex flex-col items-center text-center group">
            <div class="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-green-600 dark:text-green-400">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
            </div>
            <h3 class="text-sm font-bold text-gray-900 dark:text-white">Pedido por WhatsApp</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Atención personalizada</p>
          </div>

          <!-- Shipping -->
          <div class="flex flex-col items-center text-center group">
            <div class="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-blue-600 dark:text-blue-400">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
            </div>
            <h3 class="text-sm font-bold text-gray-900 dark:text-white">Envío Gratis</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">En compras +$999</p>
          </div>

          <!-- Warranty -->
          <div class="flex flex-col items-center text-center group">
            <div class="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-purple-600 dark:text-purple-400">
               <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h3 class="text-sm font-bold text-gray-900 dark:text-white">Garantía de Calidad</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Satisfacción asegurada</p>
          </div>

          <!-- Payment -->
          <div class="flex flex-col items-center text-center group">
            <div class="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-orange-600 dark:text-orange-400">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </div>
            <h3 class="text-sm font-bold text-gray-900 dark:text-white">Pago Seguro</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Con tarjeta o efectivo</p>
          </div>
        </div>
      </section>

      <!-- Testimonials -->
      <section class="mb-12 relative px-2">
         <div class="text-center mb-10">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">La experiencia G&L</h2>
            <div class="inline-flex items-center justify-center gap-3 bg-gray-50 dark:bg-gray-900/50 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-800">
               <span class="text-2xl font-black text-gray-900 dark:text-white">4.9</span>
               <div class="flex flex-col items-start leading-none">
                  <div class="flex gap-0.5 mb-1">
                     ${[1,2,3,4,5].map(()=>'<svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>').join("")}
                  </div>
                  <span class="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Basado en +500 reseñas</span>
               </div>
            </div>
         </div>
         
        <div class="grid md:grid-cols-3 gap-6">
          ${Ze.map(t=>`
            <div class="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none relative group hover:-translate-y-1 transition-transform duration-300">
               <div class="absolute top-6 right-6 text-gray-100 dark:text-gray-800 group-hover:text-brand/10 transition-colors duration-300">
                  <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
               </div>
              <div class="relative z-10 flex flex-col h-full">
                <div class="flex items-center gap-1 mb-4">
                   ${rt(t.rating)}
                </div>
                <p class="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed italic flex-grow">"${t.text}"</p>
                <div class="flex items-center gap-3 pt-4 border-t border-gray-50 dark:border-gray-800">
                  <img src="${t.avatar}" alt="${t.name}" class="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-700 shadow-sm"/>
                  <div>
                    <h4 class="text-sm font-bold text-gray-900 dark:text-white">${t.name}</h4>
                    <span class="inline-flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                      Compra verificada
                    </span>
                  </div>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </section>

      <!-- Instagram Feed -->
      <section class="mb-16">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Síguenos en Instagram</h2>
            <p class="text-gray-500 dark:text-gray-400 mt-1">Únete a nuestra comunidad @gyl.mx</p>
          </div>
          <a href="https://www.instagram.com/glboutiquecol/" target="_blank" class="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full text-white text-sm font-bold shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 hover:-translate-y-0.5 transition-all">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            Seguir
          </a>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          ${et.map((t,o)=>`
            <a href="https://instagram.com" target="_blank" class="aspect-square rounded-2xl overflow-hidden group relative shadow-md hover:shadow-xl transition-all">
              <img src="${t}" alt="Instagram" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <svg class="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </div>
            </a>
          `).join("")}
        </div>
      </section>

      <!-- Newsletter -->
      <section class="mb-8 relative overflow-hidden rounded-[2rem] bg-brand p-8 md:p-12">
        <div class="absolute inset-0 bg-blue-600"></div>
        <div class="absolute inset-0 bg-gradient-to-br from-brand via-blue-700 to-indigo-900"></div>
        <!-- Decorative circles -->
         <div class="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/5 blur-3xl"></div>
         <div class="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 rounded-full bg-black/10 blur-2xl"></div>
        
        <div class="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div class="text-left">
                <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur rounded-full mb-4 border border-white/10">
                    <svg class="w-4 h-4 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    <span class="text-[10px] font-bold text-white uppercase tracking-wider">Club G&L</span>
                </div>
                <h2 class="text-3xl md:text-4xl font-black text-white mb-3">Únete a nosotros.</h2>
                <p class="text-blue-100 text-lg">Suscríbete para recibir ofertas exclusivas y novedades antes que nadie. Además, <strong>10% OFF</strong> en tu primera orden.</p>
            </div>
        
          ${i?`
            <div class="bg-white/10 backdrop-blur rounded-2xl p-6 text-center border border-white/20">
              <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-green-900/20">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  </svg>
              </div>
              <h3 class="text-xl font-bold text-white mb-1">¡Ya estás dentro!</h3>
              <p class="text-blue-200 text-sm">Gracias por ser parte de la comunidad.</p>
            </div>
          `:`
            <form id="newsletter-form-page" class="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
              <div class="flex flex-col gap-4">
                  <div>
                    <label class="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2" for="email-page">Correo electrónico</label>
                    <input 
                        type="email" 
                        name="email"
                        id="email-page"
                        placeholder="ejemplo@correo.com" 
                        class="w-full px-5 py-3.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-blue-300/50 focus:outline-none focus:bg-black/30 focus:border-white/30 transition-all"
                        required
                    />
                  </div>
                  <button type="submit" class="w-full px-6 py-4 bg-white text-brand font-black rounded-xl text-sm uppercase tracking-wide hover:bg-blue-50 hover:scale-[1.02] transition-all shadow-lg shadow-black/20">
                    Suscribirme ahora
                  </button>
                  <p class="text-xs text-blue-300 text-center">Respetamos tu privacidad. Sin spam.</p>
              </div>
            </form>
          `}
        </div>
      </section>

      <!-- Locations -->
      <section class="mb-16">
        <div class="text-center mb-10">
           <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Nuestras Sucursales</h2>
           <p class="text-gray-500 dark:text-gray-400">Visítanos en nuestras tiendas físicas</p>
        </div>
        
        <div class="grid md:grid-cols-2 gap-6">
           <!-- Colima -->
           <div class="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-lg flex items-start gap-4 hover:shadow-xl transition-all group">
             <div class="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
             </div>
             <div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">Colima Centro</h3>
                <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Zaragoza #140<br/>Col. Centro, Colima</p>
                <a href="https://www.google.com/maps/place/G%26L+Colima/@19.2424015,-103.7280069,17z/data=!3m2!4b1!5s0x84255aab867046b3:0x293c46c0e72ef43a!4m6!3m5!1s0x84255aab8670a0bf:0x969da2ab885623e0!8m2!3d19.2424015!4d-103.725432!16s%2Fg%2F11c45qrg02?entry=ttu&g_ep=EgoyMDI2MDEwNy4wIKXMDSoASAFQAw%3D%3D" target="_blank" class="inline-flex items-center gap-1 text-sm font-bold text-brand mt-3 hover:underline">
                   Ver en mapa
                   <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </a>
             </div>
           </div>

           <!-- Villa de Alvarez -->
           <div class="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 shadow-lg flex items-start gap-4 hover:shadow-xl transition-all group">
             <div class="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
             </div>
             <div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">Villa de Álvarez</h3>
                <p class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">Av. María Ahumada de Gómez #30<br/>Local #6</p>
                <a href="https://www.google.com/maps/place/G%26L+Villa+de+%C3%81lvarez/@19.271313,-103.770113,14z/data=!3m1!4b1!4m6!3m5!1s0x842545c072adffd5:0xdfee853b24213661!8m2!3d19.2713167!4d-103.7332035!16s%2Fg%2F11h53ml_dy?entry=ttu&g_ep=EgoyMDI2MDEwNy4wIKXMDSoASAFQAw%3D%3D" target="_blank" class="inline-flex items-center gap-1 text-sm font-bold text-brand mt-3 hover:underline">
                   Ver en mapa
                   <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                </a>
             </div>
           </div>
        </div>
      </section>

    `,onMount(t){const o=l(t,"#copy-coupon");o&&o.addEventListener("click",()=>{navigator.clipboard.writeText("WELCOME10"),o.innerHTML='<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',setTimeout(()=>{o.innerHTML='<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>'},2e3)});const s=l(t,"#newsletter-form-page");s&&s.addEventListener("submit",n=>{n.preventDefault();const c=s.querySelector('input[type="email"]'),m=c?c.value.trim():"";m&&(We(m),s.innerHTML=`
                  <div class="flex flex-col items-center justify-center gap-2 text-white py-4 text-center animate-fade-in">
                    <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg mb-2">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <span class="text-sm font-bold">¡Suscripción exitosa!</span>
                    <p class="text-xs text-blue-200">Revisa tu correo para tu cupón.</p>
                  </div>
            `)})}}}function ne(e){return Array.from(new Set(e)).filter(Boolean).sort((r,a)=>String(r).localeCompare(String(a)))}function at(e){var n,c,m,g,b,C;const r=((n=l(e,'[name="type"]'))==null?void 0:n.value)||"",a=((c=l(e,'[name="size"]'))==null?void 0:c.value)||"",i=((m=l(e,'[name="color"]'))==null?void 0:m.value)||"",t=((g=l(e,'[name="minPrice"]'))==null?void 0:g.value)||"",o=((b=l(e,'[name="maxPrice"]'))==null?void 0:b.value)||"",s=((C=l(e,'[name="sort"]'))==null?void 0:C.value)||"";return{type:r,size:a,color:i,minPrice:t?Number(t):null,maxPrice:o?Number(o):null,sort:s}}function ot(e,r){let a=e.filter(i=>!(r.type&&i.type!==r.type||r.size&&!(i.sizes||[]).includes(r.size)||r.color&&!(i.colors||[]).includes(r.color)||r.minPrice!=null&&i.price<r.minPrice||r.maxPrice!=null&&i.price>r.maxPrice));return r.sort==="price-asc"&&a.sort((i,t)=>i.price-t.price),r.sort==="price-desc"&&a.sort((i,t)=>t.price-i.price),a}function ze(e){return{Nuevo:"bg-blue-500",Oferta:"bg-red-500",Popular:"bg-amber-500",Premium:"bg-purple-500"}[e]||"bg-gray-700"}function st(e,r){var o;const a=((o=e.images)==null?void 0:o[0])||"https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop",i=(e.sizes||[]).map(s=>`<option value="${s}">${s}</option>`).join(""),t=(e.colors||[]).map(s=>`<option value="${s}">${s}</option>`).join("");return`
    <article class="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all animate-fade-in" data-product-id="${e.id}" style="animation-delay: ${r%4*50}ms">
      <div class="aspect-[3/4] overflow-hidden relative bg-gray-100">
        <img src="${a}" alt="${e.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"/>
        <div class="absolute top-2 left-2 flex flex-col gap-1 z-20">
          ${e.badge?`<span class="px-2 py-1 text-[10px] font-bold ${ze(e.badge)} text-white rounded shadow-sm">${e.badge.toUpperCase()}</span>`:""}
          ${e.originalPrice?`<span class="px-2 py-1 text-[10px] font-bold bg-red-500 text-white rounded shadow-sm">-${Math.round((1-e.price/e.originalPrice)*100)}%</span>`:""}
          ${e.stock&&e.stock<=5?`<span class="px-2 py-1 text-[10px] font-bold bg-orange-500 text-white rounded shadow-sm badge-pulse">¡Últimas ${e.stock}!</span>`:""}
        </div>
        <button data-quickview="${e.id}" class="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-black/80 backdrop-blur text-white text-xs font-medium rounded-full">Vista rápida</button>
      </div>
      <div class="p-3">
        <h3 class="text-sm font-medium text-gray-900 truncate mb-1">${e.name}</h3>
        <div class="flex items-center gap-2 mb-3">
          <p class="text-base font-bold text-gray-900">${k(e.price)}</p>
          ${e.originalPrice?`<p class="text-xs text-gray-400 line-through">${k(e.originalPrice)}</p>`:""}
        </div>
        <div class="flex flex-col gap-2 mb-3">
          <div class="relative">
            <select class="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 pr-8 text-sm text-gray-700 focus:border-gray-400 focus:outline-none appearance-none" data-card-size>
              <option value="" disabled>Talla</option>
              ${i}
            </select>
            <svg class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </div>
          <div class="relative">
            <select class="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 pr-8 text-sm text-gray-700 focus:border-gray-400 focus:outline-none appearance-none" data-card-color>
              <option value="" disabled>Color</option>
              ${t}
            </select>
            <svg class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </div>
        </div>
        <button data-add-to-cart data-product-id="${e.id}" class="w-full flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-xs font-semibold text-white hover:bg-gray-800 active:scale-[0.98] transition-all btn-scale" type="button">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          Agregar
        </button>
      </div>
    </article>
  `}function nt(e){var o;const r=((o=e.images)==null?void 0:o[0])||"https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop",a=(e.sizes||[]).map(s=>`<option value="${s}">${s}</option>`).join(""),i=(e.colors||[]).map(s=>`<option value="${s}">${s}</option>`).join(""),t=e.originalPrice?Math.round((1-e.price/e.originalPrice)*100):0;return`
    <div id="quick-view-modal" class="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm">
      <!-- Mobile: slide from bottom, Desktop: centered modal -->
      <div class="bg-white dark:bg-gray-900 w-full md:w-auto md:max-w-2xl md:mx-4 md:rounded-2xl rounded-t-3xl max-h-[92vh] overflow-hidden animate-slide-up shadow-2xl">
        
        <!-- Desktop: horizontal layout, Mobile: vertical -->
        <div class="md:flex">
          <!-- Image Section -->
          <div class="relative md:w-72 lg:w-80 flex-shrink-0">
            <img src="${r}" alt="${e.name}" class="w-full h-64 md:h-full object-cover"/>
            
            <!-- Close button -->
            <button id="close-quickview" class="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-lg flex items-center justify-center text-gray-700 dark:text-white hover:bg-white dark:hover:bg-gray-700 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
            
            <!-- Badges -->
            <div class="absolute top-3 left-3 flex flex-col gap-1.5">
              ${e.badge?`<span class="px-2.5 py-1 text-[10px] font-bold ${ze(e.badge)} text-white rounded-md shadow-sm">${e.badge.toUpperCase()}</span>`:""}
              ${t>0?`<span class="px-2.5 py-1 text-[10px] font-bold bg-red-500 text-white rounded-md shadow-sm">-${t}%</span>`:""}
            </div>
          </div>
          
          <!-- Content Section -->
          <div class="p-5 md:p-6 flex flex-col md:w-72 lg:w-80">
            <!-- Category -->
            <span class="text-xs font-medium text-brand uppercase tracking-wider mb-1">${e.type}</span>
            
            <!-- Name -->
            <h2 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">${e.name}</h2>
            
            <!-- Price -->
            <div class="flex items-baseline gap-2 mb-4">
              <span class="text-2xl md:text-3xl font-black text-gray-900 dark:text-white">${k(e.price)}</span>
              ${e.originalPrice?`<span class="text-base text-gray-400 line-through">${k(e.originalPrice)}</span>`:""}
            </div>
            
            <!-- Stock warning -->
            ${e.stock&&e.stock<=5?`
              <div class="flex items-center gap-2 mb-4 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <svg class="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <span class="text-sm font-medium text-orange-700 dark:text-orange-400">¡Solo quedan ${e.stock} unidades!</span>
              </div>
            `:""}
            
            <!-- Selectors -->
            <div class="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Talla</label>
                <div class="relative">
                  <select id="qv-size" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand focus:ring-1 focus:ring-brand appearance-none">
                    ${a}
                  </select>
                  <svg class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Color</label>
                <div class="relative">
                  <select id="qv-color" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:border-brand focus:ring-1 focus:ring-brand appearance-none">
                    ${i}
                  </select>
                  <svg class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>
            </div>
            
            <!-- Add to cart button -->
            <button id="qv-add-to-cart" data-product-id="${e.id}" class="w-full flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 text-sm font-bold text-white hover:bg-brand-dark active:scale-[0.98] transition-all shadow-lg shadow-brand/25">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
              Agregar al carrito
            </button>
            
            <!-- Trust badges -->
            <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div class="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span class="flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                  Calidad garantizada
                </span>
                <span class="flex items-center gap-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Envío rápido
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `}function it(e){const r=ne(e.products.map(o=>o.type)),a=ne(e.products.flatMap(o=>o.sizes||[])),i=ne(e.products.flatMap(o=>o.colors||[])),t=(o,s)=>[`<option value="">${s}</option>`,...o.map(n=>`<option value="${n}">${n}</option>`)].join("");return{title:"Catálogo | G&L",showSearch:!0,html:`
      <section class="mb-4">
        <div class="flex items-center justify-between">
          <div>
            <a href="#/" class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-1">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
              Inicio
            </a>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Catálogo</h1>
          </div>
          <span id="product-count" class="text-sm text-gray-500 dark:text-gray-400">${e.products.length} productos</span>
        </div>
      </section>

      <section class="mb-5 space-y-3">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs text-gray-500">Ordenar:</span>
          <select name="sort" class="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs text-gray-900 dark:text-white focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none">
            <option value="">Relevancia</option>
            <option value="price-asc">Menor precio</option>
            <option value="price-desc">Mayor precio</option>
          </select>
          <button id="reset-filters" class="ml-auto rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Limpiar filtros
          </button>
        </div>
        <div class="overflow-x-auto pb-2 -mx-4 px-4 hide-scrollbar">
          <div class="flex gap-2 min-w-max">
            <select name="type" class="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs text-gray-900 dark:text-white focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none">${t(r,"Tipo")}</select>
            <select name="size" class="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs text-gray-900 dark:text-white focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none">${t(a,"Talla")}</select>
            <select name="color" class="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs text-gray-900 dark:text-white focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none">${t(i,"Color")}</select>
            <input name="minPrice" inputmode="numeric" type="number" min="0" class="w-24 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none" placeholder="Min $" />
            <input name="maxPrice" inputmode="numeric" type="number" min="0" class="w-24 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none" placeholder="Max $" />
          </div>
        </div>
      </section>

      <section>
        <div id="catalog-grid" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 stagger-children"></div>
      </section>

      <div id="modal-container"></div>
      <div id="toast-container" class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"></div>

      <a href="#/cart" class="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-brand text-white pl-4 pr-5 py-3 shadow-lg hover:bg-brand-dark hover:scale-105 active:scale-95 transition-all z-20 font-medium text-sm">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        Ver carrito
      </a>
    `,onMount(o){const s=l(o,"#catalog-grid"),n=l(o,"#product-count"),c=l(o,"#modal-container"),m=l(o,"#toast-container"),g=P=>{const u=document.createElement("div");u.className="toast-enter bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium flex items-center gap-2",u.innerHTML=`<svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>${P}`,m.appendChild(u),setTimeout(()=>{u.classList.add("toast-exit"),setTimeout(()=>u.remove(),300)},2e3)},b=()=>{const P=at(o),u=je();let f=u?Qe(u):e.products;const v=ot(f,P),z=u?` para "${u}"`:"";if(n.textContent=`${v.length} productos${z}`,v.length===0){s.innerHTML=`<div class="col-span-full text-center py-16"><div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></div><h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No encontramos productos</h3><p class="text-gray-500 dark:text-gray-400 text-sm">${u?`No hay resultados para "${u}". `:""}Intenta con otros filtros</p>${u?'<button id="clear-search" class="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700">Limpiar búsqueda</button>':""}</div>`;const S=s.querySelector("#clear-search");S&&S.addEventListener("click",()=>{Y("");const j=document.getElementById("global-search");j&&(j.value=""),b()});return}s.innerHTML=v.map((S,j)=>st(S,j)).join("")},C=l(o,"#reset-filters");C&&C.addEventListener("click",()=>{o.querySelectorAll('select[name="type"], select[name="size"], select[name="color"], select[name="sort"]').forEach(z=>z.selectedIndex=0);const u=l(o,'input[name="minPrice"]'),f=l(o,'input[name="maxPrice"]');u&&(u.value=""),f&&(f.value=""),Y("");const v=document.getElementById("global-search");v&&(v.value=""),b()});const q=document.getElementById("global-search");if(q){q.addEventListener("keypress",u=>{u.key==="Enter"&&(u.preventDefault(),Y(u.target.value.trim()),b())});let P;q.addEventListener("input",u=>{clearTimeout(P),P=setTimeout(()=>{Y(u.target.value.trim()),b()},300)})}setTimeout(b,100),T(o,"change",'select[name="type"],select[name="size"],select[name="color"],select[name="sort"],input[name="minPrice"],input[name="maxPrice"]',()=>b()),T(o,"click","[data-quickview]",(P,u)=>{const f=e.products.find(S=>S.id===u.dataset.quickview);if(!f)return;c.innerHTML=nt(f),document.body.style.overflow="hidden";const v=()=>{c.innerHTML="",document.body.style.overflow=""};c.querySelector("#close-quickview").addEventListener("click",v),c.querySelector("#quick-view-modal").addEventListener("click",S=>{S.target.id==="quick-view-modal"&&v()});const z=c.querySelector("#qv-add-to-cart");z.addEventListener("click",()=>{if(z.disabled)return;z.disabled=!0;const S=c.querySelector("#qv-size").value,j=c.querySelector("#qv-color").value;Ce({productId:f.id,size:S,color:j,qty:1});const R=document.querySelector('a[href="#/cart"] span');if(R){const w=parseInt(R.textContent)||0;R.textContent=w+1}else{const w=document.querySelector('a[href="#/cart"]');if(w){const d=document.createElement("span");d.className="absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white",d.textContent="1",w.appendChild(d)}}g("Producto agregado al carrito"),v()})}),T(o,"click","[data-add-to-cart]",(P,u)=>{var w,d;if(P.preventDefault(),P.stopPropagation(),u.disabled)return;u.disabled=!0;const f=u.getAttribute("data-product-id"),v=u.closest("article"),z=((w=v==null?void 0:v.querySelector("select[data-card-size]"))==null?void 0:w.value)||"",S=((d=v==null?void 0:v.querySelector("select[data-card-color]"))==null?void 0:d.value)||"";Ce({productId:f,size:z,color:S,qty:1});const j=document.querySelector('a[href="#/cart"] span');if(j){const h=parseInt(j.textContent)||0;j.textContent=h+1}else{const h=document.querySelector('a[href="#/cart"]');if(h){const y=document.createElement("span");y.className="absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white",y.textContent="1",h.appendChild(y)}}const R=u.innerHTML;u.innerHTML="✓ Agregado",u.classList.add("bg-brand"),u.classList.remove("bg-black"),g("Producto agregado al carrito"),setTimeout(()=>{u.innerHTML=R,u.classList.remove("bg-brand"),u.classList.add("bg-black"),u.disabled=!1},1500)})}}}function lt(e){var t;const r=ce(e.productId);if(!r)return"";const a=(r.price||0)*(Number(e.qty)||0),i=((t=r.images)==null?void 0:t[0])||"https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=100&h=100&fit=crop";return`
    <div class="flex gap-3 py-4 border-b border-gray-200 dark:border-gray-800" data-cart-item data-key="${e.key}">
      <div class="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img src="${i}" alt="${r.name}" class="w-full h-full object-cover" loading="lazy"/>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">${r.name}</h3>
            <p class="text-xs text-gray-500 mt-0.5">${e.size||""} ${e.color?`/ ${e.color}`:""}</p>
          </div>
          <button type="button" class="text-gray-400 hover:text-red-500 transition-colors p-1" data-remove>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="flex items-center justify-between mt-2">
          <div class="flex items-center border border-gray-200 dark:border-gray-700 rounded-md">
            <button type="button" class="w-8 h-8 flex items-center justify-center text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" data-qty-minus>−</button>
            <input
              class="w-10 h-8 bg-transparent text-center text-sm text-gray-900 dark:text-white focus:outline-none"
              type="number"
              min="1"
              inputmode="numeric"
              data-qty
              value="${e.qty}"
            />
            <button type="button" class="w-8 h-8 flex items-center justify-center text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" data-qty-plus>+</button>
          </div>
          <div class="text-sm font-semibold text-gray-900 dark:text-white">${k(a)}</div>
        </div>
      </div>
    </div>
  `}function dt(e){return{title:"Carrito | G&L",html:`
      <!-- Header -->
      <section class="mb-4">
        <a href="#/catalog" class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Seguir comprando
        </a>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Carrito (${e.cart.reduce((a,i)=>a+(Number(i.qty)||0),0)})</h1>
      </section>

      <!-- Cart Items -->
      <section class="mb-6" id="cart-list"></section>

      <!-- Summary -->
      <section class="rounded-xl bg-gray-100 dark:bg-gray-900 p-5">
        <div class="space-y-3 mb-5">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">Subtotal</span>
            <span id="cart-total" class="text-gray-900 dark:text-white"></span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-500 dark:text-gray-400">Envío</span>
            <span class="text-gray-500 dark:text-gray-400">Por calcular</span>
          </div>
          <div class="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between">
            <span class="font-semibold text-gray-900 dark:text-white">Total</span>
            <span id="cart-total-final" class="text-lg font-bold text-gray-900 dark:text-white"></span>
          </div>
        </div>

        <a
          href="#/checkout"
          class="flex items-center justify-center gap-2 w-full rounded-lg bg-black dark:bg-white px-4 py-3.5 text-sm font-semibold text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
        >
          Continuar al checkout
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
          </svg>
        </a>

        <p class="text-center text-xs text-gray-500 mt-4">
          Pago seguro por WhatsApp
        </p>
      </section>
    `,onMount(a){const i=l(a,"#cart-list"),t=l(a,"#cart-total"),o=a.querySelector("#cart-total-final");(()=>{e.cart.length?i.innerHTML=e.cart.map(lt).join(""):i.innerHTML=`
            <div class="text-center py-16">
              <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <svg class="w-10 h-10 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tu carrito está vacío</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Explora nuestra colección</p>
              <a href="#/catalog" class="inline-flex items-center gap-2 rounded-full bg-black dark:bg-white px-6 py-3 text-sm font-semibold text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                Ir a la tienda
              </a>
            </div>
          `;const c=oe();t.textContent=k(c),o&&(o.textContent=k(c))})();const n=c=>{var m;return(m=c.closest("[data-cart-item]"))==null?void 0:m.getAttribute("data-key")};T(a,"click","[data-remove]",(c,m)=>{const g=n(m);g&&De(g)}),T(a,"click","[data-qty-minus]",(c,m)=>{const g=m.closest("[data-cart-item]"),b=g==null?void 0:g.getAttribute("data-key"),C=g==null?void 0:g.querySelector("[data-qty]");if(!b||!(C instanceof HTMLInputElement))return;const q=Math.max(1,Number(C.value||1)-1);se(b,q)}),T(a,"click","[data-qty-plus]",(c,m)=>{const g=m.closest("[data-cart-item]"),b=g==null?void 0:g.getAttribute("data-key"),C=g==null?void 0:g.querySelector("[data-qty]");if(!b||!(C instanceof HTMLInputElement))return;const q=Math.max(1,Number(C.value||1)+1);se(b,q)}),T(a,"change","[data-qty]",(c,m)=>{const g=m.closest("[data-cart-item]"),b=g==null?void 0:g.getAttribute("data-key");!b||!(m instanceof HTMLInputElement)||se(b,Number(m.value||1))})}}}function ct({customer:e,cartLines:r,subtotal:a,discount:i,couponCode:t,total:o}){const s=[];s.push("*NUEVO PEDIDO G&L*"),s.push(""),s.push("*DATOS DEL CLIENTE*"),s.push(`Nombre: ${e.name}`),s.push(`WhatsApp: ${e.whatsapp}`),s.push(`Pago: ${e.paymentMethod}`),s.push(`Entrega: ${e.deliveryMethod}`),e.address&&(s.push(""),s.push("*DIRECCION DE ENVIO*"),s.push(e.address)),s.push(""),s.push("*PRODUCTOS*");let n=1;for(const c of r){const m=[c.size?`Talla: ${c.size}`:null,c.color?`Color: ${c.color}`:null].filter(Boolean).join(" - ");s.push(`${n}. ${c.name}`),m&&s.push(`   ${m}`),s.push(`   Cant: ${c.qty} x ${k(c.price)} = ${k(c.subtotal)}`),s.push(""),n++}return s.push("*RESUMEN*"),a&&a!==o&&s.push(`Subtotal: ${k(a)}`),t&&i>0&&s.push(`Cupon ${t}: -${k(i)}`),s.push(`*TOTAL: ${k(o)}*`),s.join(`
`)}function ut(e){const r=encodeURIComponent(e),a=`https://wa.me/${Ae}?text=${r}`;window.location.assign(a)}function Se(e,r){return r==="Envío a domicilio"}function gt(e){const r=oe(),a=re(),i=a?r*(a.discount||0):0,t=r-i,o=(a==null?void 0:a.freeShipping)||r>=X.freeShippingMin;return{title:"Checkout | G&L",html:`
      <div class="w-full max-w-full overflow-x-hidden">
      <section class="mb-5">
        <a href="#/cart" class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver al carrito
        </a>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>
      </section>

      <!-- Main Layout: 2 columns on desktop -->
      <div class="w-full max-w-full lg:grid lg:grid-cols-5 lg:gap-6 overflow-hidden box-border">
        
        <!-- Left Column: Form (3/5 width on desktop) -->
        <div class="lg:col-span-3 space-y-5 overflow-hidden w-full max-w-full min-w-0">
          
          <!-- Contact Info -->
          <section class="rounded-xl bg-gray-100 dark:bg-gray-900 p-5">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">1</div>
              <span class="text-sm font-medium text-gray-900 dark:text-white">Información de contacto</span>
            </div>

            <form id="checkout-form" class="space-y-4" novalidate>
              <div>
                <label class="block text-xs text-gray-500 mb-1.5">Nombre completo</label>
                <input name="name" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30" placeholder="Tu nombre completo" />
              </div>

              <div>
                <label class="block text-xs text-gray-500 mb-1.5">WhatsApp</label>
                <input name="whatsapp" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30" inputmode="tel" placeholder="+52 312 123 4567" />
              </div>
          </section>

          <!-- Payment & Delivery -->
          <section class="rounded-xl bg-gray-100 dark:bg-gray-900 p-5">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">2</div>
              <span class="text-sm font-medium text-gray-900 dark:text-white">Pago y entrega</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-gray-500 mb-1.5">Método de pago</label>
                <select name="paymentMethod" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30">
                  <option value="">Seleccionar...</option>
                  <option value="Transferencia">💳 Transferencia bancaria</option>
                  <option value="Pago al recoger">💵 Efectivo al recibir</option>
                </select>
              </div>

              <div>
                <label class="block text-xs text-gray-500 mb-1.5">Método de entrega</label>
                <select name="deliveryMethod" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30">
                  <option value="">Seleccionar...</option>
                  <option value="Recoger en tienda">🏪 Recoger en tienda</option>
                  <option value="Envío a domicilio">🚚 Envío a domicilio</option>
                </select>
              </div>
            </div>
          </section>

          <!-- Shipping Address (conditional) -->
          <section id="address-wrap" class="hidden rounded-xl bg-gray-100 dark:bg-gray-900 p-5">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-6 h-6 rounded-full bg-brand text-white text-xs font-bold flex items-center justify-center">3</div>
              <span class="text-sm font-medium text-gray-900 dark:text-white">Dirección de envío</span>
            </div>
            
            <div class="space-y-4">
              <div>
                <label class="block text-xs text-gray-500 mb-1.5">Calle</label>
                <input name="street" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30" placeholder="Ej: Av. Insurgentes Sur" />
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-500 mb-1.5">Núm. exterior</label>
                  <input name="numExt" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30" placeholder="123" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1.5">Núm. interior</label>
                  <input name="numInt" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30" placeholder="Opcional" />
                </div>
              </div>
              
              <div>
                <label class="block text-xs text-gray-500 mb-1.5">Colonia</label>
                <input name="neighborhood" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30" placeholder="Nombre de la colonia" />
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-500 mb-1.5">Ciudad</label>
                  <input name="city" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30" placeholder="Colima" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1.5">Código Postal</label>
                  <input name="zipCode" inputmode="numeric" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30" placeholder="28000" />
                </div>
              </div>
              
              <div>
                <label class="block text-xs text-gray-500 mb-1.5">Estado</label>
                <input name="state" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30" placeholder="Colima" />
              </div>
              
              <div>
                <label class="block text-xs text-gray-500 mb-1.5">Referencias para el repartidor</label>
                <textarea
                  name="references"
                  rows="2"
                  class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 resize-none"
                  placeholder="Entre calles, color de casa, referencias..."
                ></textarea>
              </div>
            </div>
          </section>

          <!-- Error message -->
          <div id="form-error" class="hidden rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500"></div>

          <!-- Submit button (mobile only) -->
          <div class="lg:hidden">
            <button
              type="submit"
              form="checkout-form"
              class="flex items-center justify-center gap-2 w-full rounded-xl bg-green-500 hover:bg-green-600 px-4 py-4 text-sm font-semibold text-white transition-colors shadow-lg shadow-green-500/20"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar pedido por WhatsApp
            </button>
          </div>
          </form>
        </div>

        <!-- Right Column: Summary (2/5 width on desktop, sticky) -->
        <div class="lg:col-span-2 mt-6 lg:mt-0 overflow-hidden w-full max-w-full min-w-0">
          <div class="lg:sticky lg:top-24 space-y-4">
            
            <!-- Order Summary -->
            <section class="rounded-xl bg-gray-100 dark:bg-gray-900 p-5">
              <div class="text-sm font-medium text-gray-900 dark:text-white mb-4">Resumen del pedido</div>
              
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400">${e.cart.reduce((n,c)=>n+(Number(c.qty)||0),0)} productos</span>
                  <span class="text-gray-900 dark:text-white">${k(r)}</span>
                </div>
                
                <div id="discount-row" class="${a?"flex":"hidden"} justify-between text-brand">
                  <span class="flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
                    <span id="discount-code">${(a==null?void 0:a.code)||""}</span>
                  </span>
                  <span id="discount-amount">-${k(i)}</span>
                </div>
                
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400">Envío</span>
                  <span class="${o?"text-brand font-medium":"text-gray-500 dark:text-gray-400"}">${o?"¡GRATIS!":"Por calcular"}</span>
                </div>
                
                <div class="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                  <span class="font-semibold text-gray-900 dark:text-white">Total</span>
                  <span id="total-amount" class="text-xl font-bold text-gray-900 dark:text-white">${k(t)}</span>
                </div>
              </div>
            </section>

            <!-- Coupon -->
            <section id="coupon-section" class="rounded-xl bg-gray-100 dark:bg-gray-900 p-4">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-3">Cupón de descuento</div>
              <div id="coupon-content">
              ${a?`
                <div class="flex items-center justify-between bg-brand/10 border border-brand/30 rounded-lg p-3">
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    <div>
                      <p class="text-sm font-medium text-brand">${a.code}</p>
                      <p class="text-xs text-brand/70">${a.label}</p>
                    </div>
                  </div>
                  <button id="remove-coupon" class="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors">Quitar</button>
                </div>
              `:`
                <div class="flex gap-2">
                  <input id="coupon-input" type="text" placeholder="Código" class="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none uppercase"/>
                  <button id="apply-coupon" class="px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors">Aplicar</button>
                </div>
                <p id="coupon-error" class="hidden text-xs text-red-500 mt-2"></p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">Prueba: <span class="font-medium text-brand">WELCOME10</span>, <span class="font-medium text-brand">VERANO20</span></p>
              `}
              </div>
            </section>

            <!-- Submit button (desktop only) -->
            <button
              type="submit"
              form="checkout-form"
              class="hidden lg:flex items-center justify-center gap-2 w-full rounded-xl bg-green-500 hover:bg-green-600 px-4 py-4 text-sm font-semibold text-white transition-colors shadow-lg shadow-green-500/20"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar pedido por WhatsApp
            </button>

            <!-- Trust badges -->
            <div class="flex justify-center gap-4 py-2">
              <div class="text-center">
                <div class="w-8 h-8 mx-auto mb-1 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <svg class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                </div>
                <span class="text-[10px] text-gray-500">Seguro</span>
              </div>
              <div class="text-center">
                <div class="w-8 h-8 mx-auto mb-1 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <span class="text-[10px] text-gray-500">Rápido</span>
              </div>
              <div class="text-center">
                <div class="w-8 h-8 mx-auto mb-1 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                  <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                </div>
                <span class="text-[10px] text-gray-500">Sin pago online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    `,onMount(n){const c=l(n,"#checkout-form"),m=l(n,"#address-wrap"),g=l(n,"#form-error"),b=n.querySelector("#coupon-content"),C=n.querySelector("#discount-row"),q=n.querySelector("#discount-code"),P=n.querySelector("#discount-amount"),u=n.querySelector("#total-amount"),f=d=>{const h=oe(),y=d?h*(d.discount||0):0,M=h-y;if(d){b.innerHTML=`
            <div class="flex items-center justify-between bg-brand/10 border border-brand/30 rounded-lg p-3">
              <div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                <div>
                  <p class="text-sm font-medium text-brand">${d.code}</p>
                  <p class="text-xs text-brand/70">${d.label}</p>
                </div>
              </div>
              <button id="remove-coupon" class="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors">Quitar</button>
            </div>
          `,C.classList.remove("hidden"),C.classList.add("flex"),q.textContent=d.code,P.textContent="-"+k(y);const x=n.querySelector("#remove-coupon");x&&x.addEventListener("click",()=>{$e(!0),f(null)})}else{b.innerHTML=`
            <div class="flex gap-2">
              <input id="coupon-input" type="text" placeholder="Código" class="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-brand focus:outline-none uppercase"/>
              <button id="apply-coupon" class="px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-dark transition-colors">Aplicar</button>
            </div>
            <p id="coupon-error" class="hidden text-xs text-red-500 mt-2"></p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">Prueba: <span class="font-medium text-brand">WELCOME10</span>, <span class="font-medium text-brand">VERANO20</span></p>
          `,C.classList.add("hidden"),C.classList.remove("flex");const x=n.querySelector("#apply-coupon"),A=n.querySelector("#coupon-input"),I=n.querySelector("#coupon-error");x&&A&&(x.addEventListener("click",()=>{const E=A.value.trim().toUpperCase();if(!E)return;const B=Me(E,!0);B.success?f(re()):(I.textContent=B.message||"Cupón inválido",I.classList.remove("hidden"))}),A.addEventListener("keypress",E=>{E.key==="Enter"&&(E.preventDefault(),x.click())}))}u.textContent=k(M)},v=n.querySelector("#coupon-input"),z=n.querySelector("#apply-coupon"),S=n.querySelector("#remove-coupon"),j=n.querySelector("#coupon-error");z&&v&&(z.addEventListener("click",()=>{const d=v.value.trim().toUpperCase();if(!d)return;const h=Me(d,!0);h.success?f(re()):(j.textContent=h.message||"Cupón inválido",j.classList.remove("hidden"))}),v.addEventListener("keypress",d=>{d.key==="Enter"&&(d.preventDefault(),z.click())})),S&&S.addEventListener("click",()=>{$e(!0),f(null)});const R=()=>{const d=l(n,'select[name="paymentMethod"]').value,h=l(n,'select[name="deliveryMethod"]').value;m.classList.toggle("hidden",!Se(d,h))},w=d=>{if(!d){g.classList.add("hidden"),g.textContent="";return}g.textContent=d,g.classList.remove("hidden")};R(),T(n,"change",'select[name="paymentMethod"],select[name="deliveryMethod"]',()=>{w(""),R()}),c.addEventListener("submit",d=>{var V,H,te,ue,ge,pe,me,xe;if(d.preventDefault(),w(""),!e.cart.length){w("Tu carrito está vacío. Volvé al catálogo para agregar productos.");return}const h=l(n,'input[name="name"]').value.trim(),y=l(n,'input[name="whatsapp"]').value.trim(),M=l(n,'select[name="paymentMethod"]').value,x=l(n,'select[name="deliveryMethod"]').value;if(!h)return w("Ingresa tu nombre.");if(!y)return w("Ingresa tu WhatsApp.");if(!M)return w("Selecciona un método de pago.");if(!x)return w("Selecciona un método de entrega.");const A=Se(M,x);let I="";if(A){const G=((V=n.querySelector('input[name="street"]'))==null?void 0:V.value.trim())||"",F=((H=n.querySelector('input[name="numExt"]'))==null?void 0:H.value.trim())||"",Q=((te=n.querySelector('input[name="numInt"]'))==null?void 0:te.value.trim())||"",J=((ue=n.querySelector('input[name="neighborhood"]'))==null?void 0:ue.value.trim())||"",be=((ge=n.querySelector('input[name="city"]'))==null?void 0:ge.value.trim())||"",he=((pe=n.querySelector('input[name="zipCode"]'))==null?void 0:pe.value.trim())||"",fe=((me=n.querySelector('input[name="state"]'))==null?void 0:me.value.trim())||"",ve=((xe=n.querySelector('textarea[name="references"]'))==null?void 0:xe.value.trim())||"";if(!G)return w("Ingresa la calle.");if(!F)return w("Ingresa el número exterior.");if(!J)return w("Ingresa la colonia.");if(!be)return w("Ingresa la ciudad.");if(!he)return w("Ingresa el código postal.");if(!fe)return w("Ingresa el estado.");I=`${G} #${F}${Q?" Int. "+Q:""}, Col. ${J}, ${be}, ${fe}, C.P. ${he}${ve?" | Ref: "+ve:""}`}const E=e.cart.map(G=>{const F=ce(G.productId);if(!F)return null;const Q=Number(G.qty)||0,J=Number(F.price)||0;return{name:F.name,type:F.type,size:G.size,color:G.color,qty:Q,price:J,subtotal:Q*J}}).filter(Boolean),B=oe(),D=re(),W=D?B*(D.discount||0):0,Z=B-W,ee=ct({customer:{name:h,whatsapp:y,paymentMethod:M,deliveryMethod:x,address:A?I:""},cartLines:E,subtotal:B,discount:W,couponCode:(D==null?void 0:D.code)||null,total:Z});ut(ee)})}}}function Ee(){return{title:"Login vendedores | G&L",html:`
      <div class="flex min-h-[70vh] items-center justify-center">
        <div class="w-full max-w-xs">
          <div class="text-center mb-8">
            <span class="text-2xl font-bold text-white">G&L</span>
            <p class="text-xs text-gray-500 mt-1">Panel de administración</p>
          </div>

          <section class="rounded-xl bg-gray-900 p-6">
            <form id="admin-login" class="space-y-4" novalidate>
              <div>
                <label class="block text-xs text-gray-500 mb-1.5">Usuario</label>
                <input name="user" class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-gray-600 focus:outline-none" autocomplete="username" placeholder="admin" />
              </div>

              <div>
                <label class="block text-xs text-gray-500 mb-1.5">Contraseña</label>
                <input name="pass" type="password" class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-gray-600 focus:outline-none" autocomplete="current-password" placeholder="••••••••" />
              </div>

              <div id="admin-error" class="hidden rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400"></div>

              <button type="submit" class="w-full rounded-lg bg-white hover:bg-gray-100 px-4 py-3 text-sm font-semibold text-black transition-colors">
                Ingresar
              </button>
            </form>
          </section>

          <div class="text-center mt-6">
            <a href="#/" class="text-xs text-gray-500 hover:text-white transition-colors">
              ← Volver a la tienda
            </a>
          </div>
        </div>
      </div>
    `,onMount(e){const r=l(e,"#admin-login"),a=l(e,"#admin-error"),i=t=>{if(!t){a.classList.add("hidden"),a.textContent="";return}a.textContent=t,a.classList.remove("hidden")};r.addEventListener("submit",t=>{t.preventDefault(),i("");const o=l(e,'input[name="user"]').value.trim(),s=l(e,'input[name="pass"]').value;if(!o||!s){i("Completá usuario y contraseña.");return}if(!_e(o,s)){i("Credenciales inválidas.");return}U("/admin/products")}),T(e,"click","#admin-logout",()=>{})}}}function pt(e){return e.split(",").map(r=>r.trim()).filter(Boolean)}const Be=[{value:"",label:"Sin badge",color:"bg-gray-500"},{value:"Nuevo",label:"Nuevo",color:"bg-blue-500"},{value:"Oferta",label:"Oferta",color:"bg-red-500"},{value:"Popular",label:"Popular",color:"bg-amber-500"},{value:"Premium",label:"Premium",color:"bg-purple-500"}],mt=["Camisas","Playeras","Polos","Pantalones","Shorts","Sudaderas","Suéteres","Chamarras","Abrigos","Perfumes"],xt=["XS","S","M","L","XL","XXL"],bt=["28","30","32","34","36","38","40","42","44","46","48","50","52"];function ht(e){const r=Be.find(a=>a.value===e);return(r==null?void 0:r.color)||"bg-gray-500"}function ft(e){var a;const r=((a=e.images)==null?void 0:a[0])||"https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=200&h=200&fit=crop";return`
    <div class="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all" data-product data-id="${e.id}">
      <div class="flex gap-4 p-4">
        <!-- Image -->
        <div class="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          <img src="${r}" alt="${e.name}" class="w-full h-full object-cover"/>
        </div>
        
        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <h3 class="font-semibold text-gray-900 truncate">${e.name}</h3>
              <p class="text-sm text-gray-500">${e.type}</p>
            </div>
            <div class="flex items-center gap-1">
              ${e.badge?`<span class="px-2 py-0.5 text-[10px] font-bold ${ht(e.badge)} text-white rounded-md">${e.badge}</span>`:""}
            </div>
          </div>
          
          <div class="flex items-center justify-between mt-2">
            <div class="flex items-baseline gap-2">
              <span class="text-lg font-bold text-gray-900">${k(e.price)}</span>
              ${e.originalPrice?`<span class="text-sm text-gray-400 line-through">${k(e.originalPrice)}</span>`:""}
            </div>
            <div class="flex items-center gap-1">
              <span class="text-xs text-gray-500">Stock: ${e.stock||"∞"}</span>
            </div>
          </div>
          
          <div class="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span>${(e.sizes||[]).join(", ")}</span>
            <span>•</span>
            <span>${(e.colors||[]).join(", ")}</span>
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex border-t border-gray-100">
        <button type="button" class="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:text-brand hover:bg-gray-50 transition-colors" data-edit>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Editar
        </button>
        <button type="button" class="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors border-l border-gray-100" data-delete>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Eliminar
        </button>
      </div>
    </div>
  `}function vt(e){const r=e.products.length,a=Be.map(t=>`<option value="${t.value}">${t.label}</option>`).join(""),i=mt.map(t=>`<option value="${t}">${t}</option>`).join("");return{title:"Productos | Admin G&L",html:`
      <!-- Header -->
      <section class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            <p class="text-sm text-gray-500 mt-1">${r} productos en catálogo</p>
          </div>
          <button type="button" id="admin-logout-btn" class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </section>

      <!-- Add Product Button -->
      <button type="button" id="toggle-form-btn" class="w-full mb-6 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-brand text-white font-semibold hover:bg-brand-dark transition-colors shadow-lg shadow-brand/25">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
        <span id="toggle-form-text">Agregar nuevo producto</span>
      </button>

      <!-- Form (hidden by default) -->
      <section id="product-form-section" class="hidden mb-6">
        <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div class="p-5 border-b border-gray-100">
            <h2 id="form-title" class="text-lg font-bold text-gray-900">Nuevo producto</h2>
            <p class="text-sm text-gray-500">Completa la información del producto</p>
          </div>
          
          <form id="product-form" class="p-5 space-y-5" novalidate>
            <input type="hidden" name="id" />

            <!-- Image URL -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                Imagen del producto
              </label>
              <div class="flex gap-3">
                <div id="image-preview" class="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <input name="imageUrl" type="url" class="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors" placeholder="https://ejemplo.com/imagen.jpg" />
              </div>
              <p class="text-xs text-gray-500 mt-1.5">Pega la URL de la imagen del producto</p>
            </div>

            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nombre del producto *
              </label>
              <input name="name" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors" placeholder="Ej: Camisa Oxford Premium" />
            </div>

            <!-- Type & Badge -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <div class="relative">
                  <select name="type" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors appearance-none">
                    <option value="">Selecciona categoría...</option>
                    ${i}
                  </select>
                  <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Badge / Etiqueta
                </label>
                <div class="relative">
                  <select name="badge" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors appearance-none">
                    ${a}
                  </select>
                  <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                </div>
              </div>
            </div>

            <!-- Price & Original Price -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Precio *
                </label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input name="price" type="number" min="0" inputmode="numeric" class="w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors" placeholder="849" />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Precio original <span class="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input name="originalPrice" type="number" min="0" inputmode="numeric" class="w-full rounded-xl border border-gray-200 bg-gray-50 pl-8 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors" placeholder="999 (para mostrar descuento)" />
                </div>
              </div>
            </div>

            <!-- Stock -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Stock disponible <span class="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input name="stock" type="number" min="0" inputmode="numeric" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors" placeholder="Ej: 10 (deja vacío para ilimitado)" />
              <p class="text-xs text-gray-500 mt-1.5">Si el stock es 5 o menos, se mostrará "¡Últimas piezas!"</p>
            </div>

            <!-- Sizes & Colors -->
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Tallas disponibles *
                </label>
                <p class="text-xs text-gray-500 mb-3">Tallas de ropa</p>
                <div class="flex flex-wrap gap-2" id="sizes-container">
                  ${xt.map(t=>`
                    <label class="inline-flex items-center">
                      <input type="checkbox" name="sizes" value="${t}" class="sr-only peer" />
                      <span class="px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-600 cursor-pointer peer-checked:bg-brand peer-checked:text-white peer-checked:border-brand hover:border-gray-300 transition-colors">${t}</span>
                    </label>
                  `).join("")}
                </div>
                <p class="text-xs text-gray-500 mt-3 mb-2">Tallas de pantalones</p>
                <div class="flex flex-wrap gap-2">
                  ${bt.map(t=>`
                    <label class="inline-flex items-center">
                      <input type="checkbox" name="sizes" value="${t}" class="sr-only peer" />
                      <span class="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm font-medium text-gray-600 cursor-pointer peer-checked:bg-brand peer-checked:text-white peer-checked:border-brand hover:border-gray-300 transition-colors">${t}</span>
                    </label>
                  `).join("")}
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Colores disponibles *
                </label>
                <input name="colors" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors" placeholder="Negro, Blanco, Azul" />
              </div>
            </div>

            <!-- Error -->
            <div id="product-error" class="hidden rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-600 flex items-center gap-2">
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span id="error-text"></span>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-2">
              <button type="submit" class="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-bold text-white hover:bg-brand-dark active:scale-[0.98] transition-all shadow-lg shadow-brand/25">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span id="submit-text">Guardar producto</span>
              </button>
              <button type="button" id="product-cancel" class="px-6 py-3.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </section>

      <!-- Products List -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-gray-900">Productos</h2>
          <span id="products-count" class="text-sm text-gray-500">${r} en total</span>
        </div>
        
        <!-- Search Bar -->
        <div class="relative mb-4">
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input id="search-products" type="text" class="w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none transition-colors" placeholder="Buscar por nombre, categoría o badge..." />
        </div>
        
        <div id="products-list" class="grid gap-4 md:grid-cols-2"></div>
      </section>
    `,onMount(t){const o=l(t,"#products-list"),s=l(t,"#product-form"),n=l(t,"#product-form-section"),c=l(t,"#toggle-form-btn"),m=l(t,"#form-title"),g=l(t,"#submit-text"),b=l(t,"#product-error"),C=l(t,"#error-text"),q=l(t,"#product-cancel"),P=l(t,"#image-preview"),u=l(t,'input[name="imageUrl"]'),f=d=>{if(!d){b.classList.add("hidden"),C.textContent="";return}C.textContent=d,b.classList.remove("hidden")},v=(d="")=>{const h=d?e.products.filter(M=>M.name.toLowerCase().includes(d.toLowerCase())||M.type.toLowerCase().includes(d.toLowerCase())||M.badge&&M.badge.toLowerCase().includes(d.toLowerCase())):e.products,y=l(t,"#products-count");if(y&&(y.textContent=d?`${h.length} de ${e.products.length} productos`:`${e.products.length} en total`),!h.length){o.innerHTML=`
            <div class="col-span-full text-center py-16">
              <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">${d?"Sin resultados":"No hay productos"}</h3>
              <p class="text-sm text-gray-500">${d?"Intenta con otro término de búsqueda":"Agrega tu primer producto usando el botón de arriba"}</p>
            </div>
          `;return}o.innerHTML=h.map(ft).join("")},z=(d=!1)=>{n.classList.remove("hidden"),c.classList.add("hidden"),m.textContent=d?"Editar producto":"Nuevo producto",g.textContent=d?"Guardar cambios":"Guardar producto",f("")},S=()=>{n.classList.add("hidden"),c.classList.remove("hidden"),s.reset(),l(t,'input[name="id"]').value="",f(""),j("")},j=d=>{d?P.innerHTML=`<img src="${d}" alt="Preview" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<svg class=\\'w-8 h-8 text-red-400\\' fill=\\'none\\' stroke=\\'currentColor\\' viewBox=\\'0 0 24 24\\'><path stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'2\\' d=\\'M6 18L18 6M6 6l12 12\\'/></svg>'" />`:P.innerHTML='<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>'};v(),l(t,"#search-products").addEventListener("input",d=>{v(d.target.value.trim())}),u.addEventListener("input",d=>{j(d.target.value)}),c.addEventListener("click",()=>z(!1)),q.addEventListener("click",S),l(t,"#admin-logout-btn").addEventListener("click",()=>{Ge(),U("/admin/login")}),s.addEventListener("submit",d=>{d.preventDefault(),f("");const h=l(t,'input[name="id"]'),y=l(t,'input[name="name"]').value.trim(),M=l(t,'select[name="type"]').value,x=Number(l(t,'input[name="price"]').value||0),A=Number(l(t,'input[name="originalPrice"]').value||0)||null,I=Number(l(t,'input[name="stock"]').value||0)||null,E=l(t,'select[name="badge"]').value||null,B=t.querySelectorAll('input[name="sizes"]:checked'),D=Array.from(B).map(H=>H.value),W=pt(l(t,'input[name="colors"]').value),Z=l(t,'input[name="imageUrl"]').value.trim();if(!y)return f("Ingresa el nombre del producto.");if(!M)return f("Selecciona la categoría del producto.");if(!Number.isFinite(x)||x<=0)return f("Ingresa un precio válido mayor a 0.");if(!D.length)return f("Selecciona al menos una talla.");if(!W.length)return f("Ingresa al menos un color.");const ee=Z?[Z]:[],V=[...e.products];if(h.value){const H=V.findIndex(te=>te.id===h.value);if(H===-1)return f("No se encontró el producto a editar.");V[H]={...V[H],name:y,type:M,price:x,originalPrice:A,stock:I,badge:E,sizes:D,colors:W,images:ee}}else{const H=`p-${crypto.randomUUID()}`;V.unshift({id:H,name:y,type:M,price:x,originalPrice:A,stock:I,badge:E,sizes:D,colors:W,images:ee,rating:4.5,reviews:0})}ke(V),S(),U("/admin/products")}),T(t,"click","[data-edit]",(d,h)=>{var I,E;const y=h.closest("[data-product]"),M=y==null?void 0:y.getAttribute("data-id"),x=e.products.find(B=>B.id===M);if(!x)return;z(!0),l(t,'input[name="id"]').value=x.id,l(t,'input[name="name"]').value=x.name,l(t,'select[name="type"]').value=x.type,l(t,'input[name="price"]').value=String(x.price),l(t,'input[name="originalPrice"]').value=x.originalPrice?String(x.originalPrice):"",l(t,'input[name="stock"]').value=x.stock?String(x.stock):"",l(t,'select[name="badge"]').value=x.badge||"",t.querySelectorAll('input[name="sizes"]').forEach(B=>{B.checked=(x.sizes||[]).includes(B.value)}),l(t,'input[name="colors"]').value=(x.colors||[]).join(", "),l(t,'input[name="imageUrl"]').value=((I=x.images)==null?void 0:I[0])||"",j(((E=x.images)==null?void 0:E[0])||""),n.scrollIntoView({behavior:"smooth",block:"start"})}),T(t,"click","[data-delete]",(d,h)=>{const y=h.closest("[data-product]"),M=y==null?void 0:y.getAttribute("data-id");if(M&&confirm("¿Estás seguro de eliminar este producto?")){const x=e.products.filter(A=>A.id!==M);ke(x),U("/admin/products")}})}}}const yt={"/":Pe,"/catalog":it,"/cart":dt,"/checkout":gt},wt={"/admin/login":Ee,"/admin/products":vt};function kt(e,r){const a=e.startsWith("/admin"),o=((a?wt:yt)[e]||(a?Ee:Pe))(r),s=o.title;return a?{title:s,html:Ye({contentHtml:o.html,state:r}),onMount:o.onMount}:{title:s,html:Ke({contentHtml:o.html,state:r,showSearch:o.showSearch}),onMount:o.onMount}}function Ct(e){Ie(),Re();const r=()=>{const n=Fe();document.documentElement.classList.toggle("dark",n==="dark"),document.body.classList.toggle("bg-black",n==="dark"),document.body.classList.toggle("bg-white",n==="light")};r();const a=n=>{const c=Ve();if(c&&!n.startsWith("/admin")){U("/admin/products");return}if(!c&&n.startsWith("/admin")&&n!=="/admin/login"){U("/admin/login");return}const{title:m,html:g,onMount:b}=kt(n,de());document.title=m,e.innerHTML=g,b==null||b(e),i()},i=()=>{const n=document.getElementById("theme-toggle");n&&n.addEventListener("click",()=>{Ue(),r(),a(K())});const c=document.getElementById("global-search");c&&c.addEventListener("keypress",m=>{if(m.key==="Enter"){const g=m.target.value.trim();Y(g),U("/catalog")}}),window.addEventListener("navigate",()=>a(K()),{once:!0})},t=Te(a),o=Oe();a(K());const s=He(()=>{const n=K();["/cart","/wishlist","/checkout"].some(m=>n.startsWith(m))&&a(n)});return()=>{o(),t(),s()}}Ct(document.querySelector("#app"));
