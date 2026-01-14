(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const n of a.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&i(n)}).observe(document,{childList:!0,subtree:!0});function t(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function i(s){if(s.ep)return;s.ep=!0;const a=t(s);fetch(s.href,a)}})();const B={name:"G&L",whatsapp:"523121018263",freeShippingMin:999},he="523121018263",y={products:"gl_products",cart:"gl_cart",adminSession:"gl_admin_session",wishlist:"gl_wishlist",theme:"gl_theme",coupon:"gl_coupon",newsletter:"gl_newsletter"},be={WELCOME10:{discount:.1,label:"10% de descuento"},VERANO20:{discount:.2,label:"20% de descuento"},ENVIOGRATIS:{discount:0,freeShipping:!0,label:"Envío gratis"}},ee={user:"admin",pass:"admin123"};function S(e,r){try{const t=localStorage.getItem(e);return t?JSON.parse(t):r}catch{return r}}function L(e,r){localStorage.setItem(e,JSON.stringify(r))}const C={camisas:["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=750&fit=crop","https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=750&fit=crop"],playeras:["https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop","https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=750&fit=crop"],pantalones:["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=750&fit=crop","https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&h=750&fit=crop"],sudaderas:["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&h=750&fit=crop","https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=600&h=750&fit=crop"],chamarras:["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=750&fit=crop","https://images.unsplash.com/photo-1559551409-dadc959f76b8?w=600&h=750&fit=crop"],general:["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=750&fit=crop","https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=750&fit=crop"]},ve=[{id:"p-oxford-01",name:"Camisa Oxford",type:"Camisas",price:799,originalPrice:999,colors:["Negro","Blanco","Azul Marino"],sizes:["S","M","L","XL"],badge:"Oferta",stock:8,rating:4.8,reviews:24,images:C.camisas},{id:"p-poplin-01",name:"Camisa Popelina Slim",type:"Camisas",price:849,originalPrice:null,colors:["Blanco","Azul Cielo","Negro"],sizes:["S","M","L","XL"],badge:"Nuevo",stock:15,rating:4.5,reviews:12,images:C.camisas},{id:"p-tee-01",name:"Playera Básica Premium",type:"Playeras",price:299,originalPrice:null,colors:["Negro","Blanco","Gris","Verde Olivo"],sizes:["S","M","L","XL","XXL"],badge:"Popular",stock:50,rating:4.9,reviews:89,images:C.playeras},{id:"p-tee-02",name:"Playera Oversize",type:"Playeras",price:349,originalPrice:449,colors:["Negro","Blanco","Arena"],sizes:["S","M","L","XL"],badge:"Oferta",stock:3,rating:4.6,reviews:31,images:C.playeras},{id:"p-polo-01",name:"Polo Piqué",type:"Polos",price:549,originalPrice:null,colors:["Negro","Azul Marino","Blanco"],sizes:["S","M","L","XL"],badge:null,stock:20,rating:4.7,reviews:18,images:C.general},{id:"p-jean-01",name:"Jeans Slim",type:"Pantalones",price:1099,originalPrice:1299,colors:["Azul","Negro"],sizes:["30","32","34","36","38"],badge:"Oferta",stock:12,rating:4.8,reviews:45,images:C.pantalones},{id:"p-jean-02",name:"Jeans Regular",type:"Pantalones",price:999,originalPrice:null,colors:["Azul Oscuro","Negro"],sizes:["30","32","34","36","38"],badge:null,stock:25,rating:4.4,reviews:22,images:C.pantalones},{id:"p-chino-01",name:"Pantalón Chino",type:"Pantalones",price:949,originalPrice:null,colors:["Negro","Beige","Verde Olivo"],sizes:["30","32","34","36","38"],badge:"Nuevo",stock:18,rating:4.6,reviews:15,images:C.pantalones},{id:"p-bermuda-01",name:"Short Chino",type:"Shorts",price:699,originalPrice:null,colors:["Negro","Beige"],sizes:["30","32","34","36"],badge:null,stock:10,rating:4.3,reviews:8,images:C.general},{id:"p-hoodie-01",name:"Sudadera Hoodie Minimal",type:"Sudaderas",price:899,originalPrice:1099,colors:["Negro","Gris"],sizes:["S","M","L","XL"],badge:"Popular",stock:6,rating:4.9,reviews:67,images:C.sudaderas},{id:"p-crewneck-01",name:"Sudadera Crewneck",type:"Sudaderas",price:849,originalPrice:null,colors:["Negro","Gris","Azul Marino"],sizes:["S","M","L","XL"],badge:null,stock:14,rating:4.5,reviews:19,images:C.sudaderas},{id:"p-sweater-01",name:"Suéter Tejido Fino",type:"Suéteres",price:899,originalPrice:null,colors:["Negro","Gris","Bordó"],sizes:["S","M","L","XL"],badge:"Nuevo",stock:9,rating:4.7,reviews:11,images:C.general},{id:"p-jacket-01",name:"Chamarra Urban",type:"Chamarras",price:1699,originalPrice:null,colors:["Negro"],sizes:["M","L","XL"],badge:null,stock:2,rating:4.8,reviews:28,images:C.chamarras},{id:"p-jacket-02",name:"Chamarra Bomber",type:"Chamarras",price:1899,originalPrice:2299,colors:["Negro","Verde Olivo"],sizes:["S","M","L","XL"],badge:"Oferta",stock:4,rating:4.9,reviews:52,images:C.chamarras},{id:"p-coat-01",name:"Abrigo de Paño",type:"Abrigos",price:2999,originalPrice:null,colors:["Negro","Gris"],sizes:["M","L","XL"],badge:"Premium",stock:5,rating:5,reviews:14,images:C.chamarras}],te=2;function fe(){const e=localStorage.getItem("gl_seed_version"),r=S(y.products,null);(e!==String(te)||!Array.isArray(r)||r.length===0)&&(L(y.products,ve),localStorage.setItem("gl_seed_version",String(te)))}const D=new Set;function A(){const e=window.location.hash||"#/";return(e.startsWith("#")?e.slice(1):e)||"/"}function P(e){const r=e.startsWith("/")?e:`/${e}`;window.location.hash=`#${r}`}function ye(e){return D.add(e),()=>D.delete(e)}function we(){const e=()=>{for(const r of D)r(A())};return window.addEventListener("hashchange",e),e(),()=>{window.removeEventListener("hashchange",e)}}const G=new Set,p={products:S(y.products,[]),cart:S(y.cart,[]),adminSession:S(y.adminSession,null),wishlist:S(y.wishlist,[]),theme:S(y.theme,"dark"),coupon:S(y.coupon,null),newsletter:S(y.newsletter,null),searchQuery:""};function M(){for(const e of G)e(F())}function ke(e){return G.add(e),()=>G.delete(e)}function F(){return structuredClone(p)}function $e(){p.products=S(y.products,[]),M()}function re(e){p.products=e,L(y.products,e),M()}function I(e){return p.products.find(r=>r.id===e)||null}function R({productId:e,size:r,color:t,qty:i}){const s=Math.max(1,Number(i)),a=`${e}__${r||""}__${t||""}`,n=p.cart.find(o=>o.key===a);n?n.qty+=s:p.cart.push({key:a,productId:e,size:r||"",color:t||"",qty:s}),L(y.cart,p.cart),M()}function V(e,r){const t=p.cart.find(i=>i.key===e);t&&(t.qty=Math.max(1,Number(r||1)),L(y.cart,p.cart),M())}function Ce(e){p.cart=p.cart.filter(r=>r.key!==e),L(y.cart,p.cart),M()}function W(){return p.cart.reduce((e,r)=>{const t=I(r.productId),i=(t==null?void 0:t.price)||0;return e+i*(Number(r.qty)||0)},0)}function Me(){return!!(p.adminSession&&p.adminSession.ok)}function Le(e,r){const t=e===ee.user&&r===ee.pass;return p.adminSession=t?{ok:!0,at:Date.now()}:null,L(y.adminSession,p.adminSession),M(),t}function ae(){p.adminSession=null,L(y.adminSession,null),M()}function X(e){const r=p.wishlist.indexOf(e);r===-1?p.wishlist.push(e):p.wishlist.splice(r,1),L(y.wishlist,p.wishlist),M()}function U(e){return p.wishlist.includes(e)}function je(){return p.wishlist.map(e=>I(e)).filter(Boolean)}function Se(){return p.theme}function ze(){return p.theme=p.theme==="dark"?"light":"dark",L(y.theme,p.theme),M(),p.theme}function Pe(e){const r=e.toUpperCase().trim(),t=be[r];return t?(p.coupon={code:r,...t},L(y.coupon,p.coupon),M(),{success:!0,coupon:p.coupon}):{success:!1,error:"Cupón no válido"}}function Be(){p.coupon=null,L(y.coupon,null),M()}function se(){return p.coupon}function Ee(e){return p.newsletter={email:e,subscribedAt:Date.now()},L(y.newsletter,p.newsletter),M(),!0}function Ae(){var e;return!!((e=p.newsletter)!=null&&e.email)}function le(e){p.searchQuery=e,M()}function qe(){return p.searchQuery}function Ne(e){const r=e.toLowerCase().trim();return r?p.products.filter(t=>t.name.toLowerCase().includes(r)||t.type.toLowerCase().includes(r)||t.colors.some(i=>i.toLowerCase().includes(r))):p.products}function ce(e,r="dark"){return`<div class="min-h-dvh ${r==="dark"?"bg-black text-white":"bg-white text-gray-900"}">
    ${e}
  </div>`}function Te({contentHtml:e,state:r,showSearch:t=!1}){const i=(r.cart||[]).reduce((d,u)=>d+(Number(u.qty)||0),0),s=(r.wishlist||[]).length,a=r.theme||"dark",n=a==="dark",o=t?`
      <!-- Search Bar -->
      <div class="mx-auto w-full max-w-screen-sm px-4 pt-3">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${n?"text-gray-500":"text-gray-400"}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input 
            type="search" 
            id="global-search"
            placeholder="Buscar productos..." 
            class="w-full pl-10 pr-4 py-2.5 rounded-full ${n?"bg-gray-900 border-gray-800 text-white placeholder:text-gray-500":"bg-gray-100 border-gray-200 text-gray-900 placeholder:text-gray-400"} border text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
        </div>
      </div>
  `:"";return ce(`
    <!-- Free Shipping Banner -->
    <div class="bg-brand text-white text-center py-2 px-4">
      <p class="text-xs font-medium flex items-center justify-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
        </svg>
        <span>Envío GRATIS en compras +$${B.freeShippingMin} MXN</span>
      </p>
    </div>

    <header class="sticky top-0 z-30 ${n?"bg-black/95":"bg-white/95"} backdrop-blur-lg border-b ${n?"border-gray-800/50":"border-gray-200"}">
      ${o}
      <!-- Navigation -->
      <div class="mx-auto flex w-full max-w-screen-sm items-center justify-between px-4 py-3">
        <a href="#/" class="flex items-center gap-2">
          <img src="/logo.png" alt="G&L" class="h-10 w-auto object-contain" />
        </a>
        <nav class="flex items-center gap-3">
          <a class="text-sm ${n?"text-gray-300 hover:text-white":"text-gray-600 hover:text-gray-900"} transition-colors" href="#/catalog">
            Tienda
          </a>

          <!-- Wishlist -->
          <a class="relative p-1.5 ${n?"text-gray-300 hover:text-white":"text-gray-600 hover:text-gray-900"} transition-colors" href="#/wishlist" title="Favoritos">
            <svg class="w-5 h-5" fill="${s>0?"currentColor":"none"}" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
            </svg>
            ${s>0?`<span class="absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">${s}</span>`:""}
          </a>

          <!-- Cart -->
          <a class="relative p-1.5 ${n?"text-gray-300 hover:text-white":"text-gray-600 hover:text-gray-900"} transition-colors" href="#/cart" title="Carrito">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
            </svg>
            ${i>0?`<span class="absolute -top-1 -right-1 min-w-4 h-4 flex items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">${i}</span>`:""}
          </a>
          </a>

          <!-- Theme Toggle -->
          <button id="theme-toggle" class="p-1.5 ${n?"text-gray-300 hover:text-white":"text-gray-600 hover:text-gray-900"} transition-colors" title="Cambiar tema">
            ${n?'<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>':'<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>'}
          </button>
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-screen-sm px-4 py-5 pb-24">
      ${e}
    </main>

    <footer class="${n?"bg-gray-950 border-gray-800/50":"bg-gray-100 border-gray-200"} border-t">
      <div class="mx-auto w-full max-w-screen-sm px-4 py-8">
        <div class="flex flex-col items-center text-center">
          <span class="text-lg font-bold ${n?"text-white":"text-gray-900"} mb-2">G&L</span>
          <p class="text-xs ${n?"text-gray-500":"text-gray-600"} mb-4">Moda masculina · Colima, México</p>
          
          <div class="flex items-center gap-4 mb-6">
            <a href="https://wa.me/${B.whatsapp}" target="_blank" class="w-10 h-10 rounded-full ${n?"bg-gray-800 hover:bg-gray-700":"bg-gray-200 hover:bg-gray-300"} flex items-center justify-center transition-colors">
              <svg class="w-5 h-5 ${n?"text-white":"text-gray-700"}" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" class="w-10 h-10 rounded-full ${n?"bg-gray-800 hover:bg-gray-700":"bg-gray-200 hover:bg-gray-300"} flex items-center justify-center transition-colors">
              <svg class="w-5 h-5 ${n?"text-white":"text-gray-700"}" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>

          <div class="flex flex-wrap justify-center gap-4 mb-4 text-xs ${n?"text-gray-500":"text-gray-600"}">
            <a href="#/catalog" class="hover:underline">Catálogo</a>
            <a href="#/cart" class="hover:underline">Carrito</a>
            <a href="https://wa.me/${B.whatsapp}" target="_blank" class="hover:underline">Contacto</a>
          </div>

          <div class="text-xs ${n?"text-gray-600":"text-gray-500"}">
            © 2026 ${B.name}. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </footer>
  `,a)}function Ie({contentHtml:e,state:r}){var i;const t=!!((i=r==null?void 0:r.adminSession)!=null&&i.ok);return ce(`
    <header class="sticky top-0 z-30 bg-black/90 backdrop-blur-lg border-b border-gray-800/50">
      <div class="mx-auto flex w-full max-w-screen-sm items-center justify-between px-4 py-3">
        <div class="flex items-center gap-2">
          <span class="text-lg font-bold text-white">G&L</span>
          <span class="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">Admin</span>
        </div>
        ${t?`<button id="admin-logout" class="text-sm text-gray-400 hover:text-white transition-colors">
                Salir
              </button>`:""}
      </div>
    </header>

    <main class="mx-auto w-full max-w-screen-sm px-4 py-5">
      ${e}
    </main>
  `)}function w(e){return Number(e||0).toLocaleString("es-MX",{style:"currency",currency:"MXN",maximumFractionDigits:0})}function l(e,r){const t=e.querySelector(r);if(!t)throw new Error(`Missing element: ${r}`);return t}function $(e,r,t,i){e.addEventListener(r,s=>{const a=s.target;if(!(a instanceof Element))return;const n=a.closest(t);!n||!e.contains(n)||i(s,n)})}const T=[{image:"https://images.unsplash.com/photo-1507680434567-5739c80be1ac?w=800&h=600&fit=crop",badge:"NUEVA COLECCIÓN 2026",title:"Estilo<br/>sin esfuerzo",subtitle:"Descubre tu estilo con nosotros.",accent:"from-blue-600/30"},{image:"https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=800&h=600&fit=crop",badge:"OFERTAS ESPECIALES",title:"Hasta 30%<br/>de descuento",subtitle:"En prendas seleccionadas. Por tiempo limitado.",accent:"from-red-600/30"},{image:"https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=800&h=600&fit=crop",badge:"TEMPORADA",title:"Lo mejor<br/>del invierno",subtitle:"Chamarras, sudaderas y más.",accent:"from-purple-600/30"}],He=[{name:"Carlos M.",rating:5,text:"Excelente calidad en las playeras. Ya es mi tercera compra.",avatar:"https://randomuser.me/api/portraits/men/32.jpg"},{name:"Roberto G.",rating:5,text:"El envío fue rapidísimo y la atención por WhatsApp muy buena.",avatar:"https://randomuser.me/api/portraits/men/44.jpg"},{name:"Miguel A.",rating:4,text:"Los pantalones quedaron perfectos. Muy recomendado.",avatar:"https://randomuser.me/api/portraits/men/22.jpg"}],Oe=["https://images.unsplash.com/photo-1617137968427-85924c800a22?w=300&h=300&fit=crop","https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=300&h=300&fit=crop","https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&h=300&fit=crop","https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=300&h=300&fit=crop"];function Ve(e){return{Nuevo:"bg-blue-500",Oferta:"bg-red-500",Popular:"bg-amber-500",Premium:"bg-purple-500"}[e]||"bg-gray-700"}function _e(e){const r=Math.floor(e),t=e%1>=.5;let i="";for(let s=0;s<5;s++)s<r?i+='<svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>':s===r&&t?i+='<svg class="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" opacity="0.5"/></svg>':i+='<svg class="w-3.5 h-3.5 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';return i}function oe(e,r){var s;const t=((s=e.images)==null?void 0:s[0])||"https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop",i=U(e.id);return`
    <article class="group relative bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in h-full flex flex-col" style="animation-delay: ${r*50}ms">
      <a href="#/catalog" class="block relative aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-gray-800">
        <img 
          src="${t}" 
          alt="${e.name}"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        
        <!-- Badges -->
        <div class="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
          ${e.badge?`<span class="inline-flex px-2.5 py-1 text-[10px] font-bold tracking-wider ${Ve(e.badge)} text-white uppercase rounded-md shadow-sm">${e.badge}</span>`:""}
          ${e.stock<=5&&e.stock>0?'<span class="inline-flex px-2.5 py-1 text-[10px] font-bold tracking-wider bg-orange-500 text-white uppercase rounded-md shadow-sm">¡Últimas piezas!</span>':""}
        </div>

        <!-- Wishlist -->
        <button 
          data-wishlist="${e.id}" 
          class="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all text-gray-400 hover:text-red-500 dark:text-gray-400 group-hover/btn:text-red-500"
        >
          <svg class="w-5 h-5 ${i?"text-red-500 fill-current":"fill-none"}" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        </button>
      </a>
      
      <div class="p-4 flex flex-col flex-grow">
        
        <h3 class="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-brand transition-colors">${e.name}</h3>
        
        <div class="mt-auto flex items-center gap-2 pt-2">
            <p class="text-lg font-black text-gray-900 dark:text-white">${w(e.price)}</p>
            ${e.originalPrice?`<p class="text-xs text-gray-400 line-through decoration-gray-400/50">${w(e.originalPrice)}</p>`:""}
            ${e.originalPrice?`<span class="text-[10px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded">-${Math.round((1-e.price/e.originalPrice)*100)}%</span>`:""}
        </div>
      </div>
    </article>
  `}function de(){const e=F();[...e.products].slice(0,4);const r=[...e.products].sort((s,a)=>(a.reviews||0)-(s.reviews||0)).slice(0,4),t=e.products.filter(s=>s.badge==="Nuevo").slice(0,4),i=Ae();return{title:`${B.name} | Men´s Cloting`,html:`
      <!-- Hero Section - Redesigned -->
      <section class="relative -mx-4 -mt-5 mb-8">
        <div class="relative h-[65vh] min-h-[500px] w-full overflow-hidden">
            <img 
              src="${T[0].image}"
              alt="Nueva Colección"
              class="absolute inset-0 w-full h-full object-cover object-center animate-fade-in"
            />
            <div class="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/60 to-transparent"></div>
            <div class="absolute inset-0 flex items-center p-6 md:p-12">
              <div class="max-w-lg space-y-6 animate-slide-up">
                 <span class="inline-block px-3 py-1 bg-brand text-white text-xs font-bold tracking-[0.2em] uppercase rounded shadow-lg shadow-brand/20 backdrop-blur-sm">
                  ${T[0].badge}
                </span>
                <h1 class="text-5xl md:text-7xl font-black text-white leading-[1.1] drop-shadow-xl">
                  ${T[0].title}
                </h1>
                <p class="text-lg text-gray-200 font-medium leading-relaxed drop-shadow-md border-l-4 border-brand pl-4">
                   ${T[0].subtitle}
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
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Camisas -->
          <a href="#/catalog" class="relative aspect-[3/4] md:aspect-[4/5] rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500 block">
            <img src="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=800&fit=crop" alt="Camisas" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>
            <div class="absolute inset-0 flex flex-col items-center justify-center p-8 text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <span class="inline-block px-4 py-1.5 bg-white/10 backdrop-blur rounded-full text-xs font-bold text-white uppercase tracking-widest mb-4 border border-white/20 shadow-sm">Casual</span>
              <h3 class="text-2xl md:text-3xl font-black text-white mb-3 leading-tight drop-shadow-lg">Camisas Premium</h3>
              <p class="text-gray-200 text-sm font-medium max-w-[200px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 translate-y-2 group-hover:translate-y-0">Estilo y confort para cualquier ocasión.</p>
            </div>
          </a>
          
          <!-- Playeras -->
          <a href="#/catalog" class="relative aspect-[3/4] md:aspect-[4/5] rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500 block">
            <img src="https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=800&fit=crop" alt="Playeras" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>
             <div class="absolute inset-0 flex flex-col items-center justify-center p-8 text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <span class="inline-block px-4 py-1.5 bg-white/10 backdrop-blur rounded-full text-xs font-bold text-white uppercase tracking-widest mb-4 border border-white/20 shadow-sm">Básicos</span>
              <h3 class="text-2xl md:text-3xl font-black text-white mb-3 leading-tight drop-shadow-lg">Playeras Esenciales</h3>
              <p class="text-gray-200 text-sm font-medium max-w-[200px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 translate-y-2 group-hover:translate-y-0">Algodón pima de alta calidad.</p>
            </div>
          </a>
          
          <!-- Pantalones -->
          <a href="#/catalog" class="relative aspect-[3/4] md:aspect-[4/5] rounded-3xl overflow-hidden group shadow-md hover:shadow-2xl transition-all duration-500 block">
            <img src="https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=800&fit=crop" alt="Pantalones" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>
             <div class="absolute inset-0 flex flex-col items-center justify-center p-8 text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <span class="inline-block px-4 py-1.5 bg-white/10 backdrop-blur rounded-full text-xs font-bold text-white uppercase tracking-widest mb-4 border border-white/20 shadow-sm">Denim</span>
              <h3 class="text-2xl md:text-3xl font-black text-white mb-3 leading-tight drop-shadow-lg">Jeans & Pantalones</h3>
              <p class="text-gray-200 text-sm font-medium max-w-[200px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 translate-y-2 group-hover:translate-y-0">Corte perfecto y durabilidad.</p>
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
          ${r.map((s,a)=>oe(s,a)).join("")}
        </div>
        
         <div class="mt-8 text-center md:hidden">
            <a href="#/catalog" class="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-200 transition-colors">
                Ver más productos
            </a>
        </div>
      </section>

      <!-- Promo Banner -->
      <section class="mb-16 relative rounded-[2rem] overflow-hidden shadow-2xl group">
        <img 
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop"
          alt="Promo"
          class="w-full h-64 md:h-80 object-cover group-hover:scale-105 transition-transform duration-1000"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent"></div>
        <div class="absolute inset-0 flex items-center p-8 md:p-12">
          <div class="max-w-md animate-slide-up">
            <div class="inline-flex items-center gap-2 px-3 py-1 bg-brand text-white rounded-full mb-4 shadow-lg shadow-brand/20">
              <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              <span class="text-[10px] font-black uppercase tracking-wider">Oferta Exclusiva</span>
            </div>
            
            <h2 class="text-4xl md:text-5xl font-black text-white leading-tight mb-2">10% OFF</h2>
            <p class="text-lg text-gray-200 mb-6 font-medium">Obtén un descuento especial en tu primera compra.</p>
            
            <div class="flex flex-col sm:flex-row items-start gap-3">
              <div class="relative group/code">
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
      ${t.length>0?`
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
          ${t.map((s,a)=>oe(s,a)).join("")}
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
          ${He.map(s=>`
            <div class="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none relative group hover:-translate-y-1 transition-transform duration-300">
               <div class="absolute top-6 right-6 text-gray-100 dark:text-gray-800 group-hover:text-brand/10 transition-colors duration-300">
                  <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
               </div>
              <div class="relative z-10 flex flex-col h-full">
                <div class="flex items-center gap-1 mb-4">
                   ${_e(s.rating)}
                </div>
                <p class="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed italic flex-grow">"${s.text}"</p>
                <div class="flex items-center gap-3 pt-4 border-t border-gray-50 dark:border-gray-800">
                  <img src="${s.avatar}" alt="${s.name}" class="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-700 shadow-sm"/>
                  <div>
                    <h4 class="text-sm font-bold text-gray-900 dark:text-white">${s.name}</h4>
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
          ${Oe.map((s,a)=>`
            <a href="https://instagram.com" target="_blank" class="aspect-square rounded-2xl overflow-hidden group relative shadow-md hover:shadow-xl transition-all">
              <img src="${s}" alt="Instagram" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
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
            <form id="newsletter-form" class="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
              <div class="flex flex-col gap-4">
                  <div>
                    <label class="block text-xs font-bold text-blue-200 uppercase tracking-wider mb-2" for="email">Correo electrónico</label>
                    <input 
                        type="email" 
                        name="email"
                        id="email"
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
    `,onMount(s){const a=l(s,"#copy-coupon");a&&a.addEventListener("click",()=>{navigator.clipboard.writeText("WELCOME10"),a.innerHTML='<svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>',setTimeout(()=>{a.innerHTML='<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>'},2e3)}),$(s,"click","[data-wishlist]",(o,d)=>{o.preventDefault(),o.stopPropagation();const u=d.dataset.wishlist;X(u);const g=d.querySelector("svg");g.classList.add("heart-pop"),setTimeout(()=>g.classList.remove("heart-pop"),300)});const n=l(s,"#newsletter-form");n&&n.addEventListener("submit",o=>{o.preventDefault();const d=n.querySelector('input[name="email"]').value.trim();d&&(Ee(d),n.innerHTML=`
              <div class="flex items-center justify-center gap-2 text-white py-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-sm font-medium">¡Gracias por suscribirte!</span>
              </div>
            `)})}}}function _(e){return Array.from(new Set(e)).filter(Boolean).sort((r,t)=>String(r).localeCompare(String(t)))}function De(e){var o,d,u,g,x,b;const r=((o=l(e,'[name="type"]'))==null?void 0:o.value)||"",t=((d=l(e,'[name="size"]'))==null?void 0:d.value)||"",i=((u=l(e,'[name="color"]'))==null?void 0:u.value)||"",s=((g=l(e,'[name="minPrice"]'))==null?void 0:g.value)||"",a=((x=l(e,'[name="maxPrice"]'))==null?void 0:x.value)||"",n=((b=l(e,'[name="sort"]'))==null?void 0:b.value)||"";return{type:r,size:t,color:i,minPrice:s?Number(s):null,maxPrice:a?Number(a):null,sort:n}}function Ge(e,r){let t=e.filter(i=>!(r.type&&i.type!==r.type||r.size&&!(i.sizes||[]).includes(r.size)||r.color&&!(i.colors||[]).includes(r.color)||r.minPrice!=null&&i.price<r.minPrice||r.maxPrice!=null&&i.price>r.maxPrice));return r.sort==="price-asc"&&t.sort((i,s)=>i.price-s.price),r.sort==="price-desc"&&t.sort((i,s)=>s.price-i.price),t}function ue(e){return{Nuevo:"bg-blue-500",Oferta:"bg-red-500",Popular:"bg-amber-500",Premium:"bg-purple-500"}[e]||"bg-gray-700"}function Re(e,r){var n;const t=((n=e.images)==null?void 0:n[0])||"https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop",i=U(e.id),s=(e.sizes||[]).map(o=>`<option value="${o}">${o}</option>`).join(""),a=(e.colors||[]).map(o=>`<option value="${o}">${o}</option>`).join("");return`
    <article class="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all animate-fade-in" data-product-id="${e.id}" style="animation-delay: ${r%4*50}ms">
      <div class="aspect-[3/4] overflow-hidden relative bg-gray-100">
        <img src="${t}" alt="${e.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"/>
        <div class="absolute top-2 left-2 flex flex-col gap-1 z-20">
          ${e.badge?`<span class="px-2 py-1 text-[10px] font-bold ${ue(e.badge)} text-white rounded shadow-sm">${e.badge.toUpperCase()}</span>`:""}
          ${e.originalPrice?`<span class="px-2 py-1 text-[10px] font-bold bg-red-500 text-white rounded shadow-sm">-${Math.round((1-e.price/e.originalPrice)*100)}%</span>`:""}
          ${e.stock&&e.stock<=5?`<span class="px-2 py-1 text-[10px] font-bold bg-orange-500 text-white rounded shadow-sm badge-pulse">¡Últimas ${e.stock}!</span>`:""}
        </div>
        <button data-wishlist="${e.id}" class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition-transform btn-scale z-10">
          <svg class="w-4 h-4 ${i?"text-red-500":"text-gray-400"}" fill="${i?"currentColor":"none"}" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        </button>
        <button data-quickview="${e.id}" class="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-black/80 backdrop-blur text-white text-xs font-medium rounded-full">Vista rápida</button>
      </div>
      <div class="p-3">
        <h3 class="text-sm font-medium text-gray-900 truncate mb-1">${e.name}</h3>
        <div class="flex items-center gap-2 mb-3">
          <p class="text-base font-bold text-gray-900">${w(e.price)}</p>
          ${e.originalPrice?`<p class="text-xs text-gray-400 line-through">${w(e.originalPrice)}</p>`:""}
        </div>
        <div class="grid grid-cols-2 gap-2 mb-3">
          <select class="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-700 focus:border-gray-400 focus:outline-none" name="size">${s}</select>
          <select class="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-700 focus:border-gray-400 focus:outline-none" name="color">${a}</select>
        </div>
        <button data-add-to-cart data-product-id="${e.id}" class="w-full flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 text-xs font-semibold text-white hover:bg-gray-800 active:scale-[0.98] transition-all btn-scale" type="button">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          Agregar
        </button>
      </div>
    </article>
  `}function We(e){var s;const r=((s=e.images)==null?void 0:s[0])||"https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&h=750&fit=crop",t=(e.sizes||[]).map(a=>`<option value="${a}">${a}</option>`).join(""),i=(e.colors||[]).map(a=>`<option value="${a}">${a}</option>`).join("");return`
    <div id="quick-view-modal" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-backdrop">
      <div class="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto animate-slide-up">
        <div class="relative">
          <img src="${r}" alt="${e.name}" class="w-full aspect-square object-cover"/>
          <button id="close-quickview" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          ${e.badge?`<span class="absolute top-4 left-4 px-3 py-1 text-xs font-bold ${ue(e.badge)} text-white rounded">${e.badge.toUpperCase()}</span>`:""}
        </div>
        <div class="p-5">
          <h2 class="text-xl font-bold text-gray-900 mb-1">${e.name}</h2>
          <p class="text-sm text-gray-500 mb-3">${e.type}</p>
          <div class="flex items-center gap-3 mb-4">
            <span class="text-2xl font-bold text-gray-900">${w(e.price)}</span>
            ${e.originalPrice?`<span class="text-lg text-gray-400 line-through">${w(e.originalPrice)}</span>`:""}
          </div>
          ${e.stock&&e.stock<=5?`<div class="flex items-center gap-2 mb-4 text-orange-600"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg><span class="text-sm font-medium">¡Solo quedan ${e.stock} unidades!</span></div>`:""}
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div><label class="block text-xs text-gray-500 mb-1">Talla</label><select id="qv-size" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm">${t}</select></div>
            <div><label class="block text-xs text-gray-500 mb-1">Color</label><select id="qv-color" class="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm">${i}</select></div>
          </div>
          <button id="qv-add-to-cart" data-product-id="${e.id}" class="w-full flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-3.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors btn-scale">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  `}function Fe(e){const r=_(e.products.map(a=>a.type)),t=_(e.products.flatMap(a=>a.sizes||[])),i=_(e.products.flatMap(a=>a.colors||[])),s=(a,n)=>[`<option value="">${n}</option>`,...a.map(o=>`<option value="${o}">${o}</option>`)].join("");return{title:"Catálogo | G&L",showSearch:!0,html:`
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
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">Ordenar:</span>
          <select name="sort" class="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs text-gray-900 dark:text-white focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none">
            <option value="">Relevancia</option>
            <option value="price-asc">Menor precio</option>
            <option value="price-desc">Mayor precio</option>
          </select>
        </div>
        <div class="overflow-x-auto pb-2 -mx-4 px-4 hide-scrollbar">
          <div class="flex gap-2 min-w-max">
            <select name="type" class="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs text-gray-900 dark:text-white focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none">${s(r,"Tipo")}</select>
            <select name="size" class="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs text-gray-900 dark:text-white focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none">${s(t,"Talla")}</select>
            <select name="color" class="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs text-gray-900 dark:text-white focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none">${s(i,"Color")}</select>
            <input name="minPrice" inputmode="numeric" type="number" min="0" class="w-24 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none" placeholder="Min $" />
            <input name="maxPrice" inputmode="numeric" type="number" min="0" class="w-24 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none" placeholder="Max $" />
          </div>
        </div>
      </section>

      <section>
        <div id="catalog-grid" class="grid grid-cols-2 gap-3 stagger-children"></div>
      </section>

      <div id="modal-container"></div>
      <div id="toast-container" class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"></div>

      <a href="#/cart" class="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-brand text-white pl-4 pr-5 py-3 shadow-lg hover:bg-brand-dark hover:scale-105 active:scale-95 transition-all z-20 font-medium text-sm">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
        Ver carrito
      </a>
    `,onMount(a){const n=l(a,"#catalog-grid"),o=l(a,"#product-count"),d=l(a,"#modal-container"),u=l(a,"#toast-container"),g=b=>{const c=document.createElement("div");c.className="toast-enter bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium flex items-center gap-2",c.innerHTML=`<svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>${b}`,u.appendChild(c),setTimeout(()=>{c.classList.add("toast-exit"),setTimeout(()=>c.remove(),300)},2e3)},x=()=>{const b=De(a),c=qe();let f=c?Ne(c):e.products;const m=Ge(f,b),h=c?` para "${c}"`:"";if(o.textContent=`${m.length} productos${h}`,m.length===0){n.innerHTML=`<div class="col-span-2 text-center py-16"><div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center"><svg class="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg></div><h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No encontramos productos</h3><p class="text-gray-500 dark:text-gray-400 text-sm">${c?`No hay resultados para "${c}". `:""}Intenta con otros filtros</p>${c?'<button id="clear-search" class="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700">Limpiar búsqueda</button>':""}</div>`;const v=n.querySelector("#clear-search");v&&v.addEventListener("click",()=>{le(""),x()});return}n.innerHTML=m.map((v,k)=>Re(v,k)).join("")};setTimeout(x,100),$(a,"change",'select,input[name="minPrice"],input[name="maxPrice"]',()=>x()),$(a,"click","[data-wishlist]",(b,c)=>{b.preventDefault(),b.stopPropagation();const f=c.dataset.wishlist,m=U(f);X(f);const h=c.querySelector("svg");h.classList.add("heart-pop"),setTimeout(()=>h.classList.remove("heart-pop"),300),h.classList.toggle("text-red-500",!m),h.classList.toggle("text-gray-400",m),h.setAttribute("fill",m?"none":"currentColor"),g(m?"Eliminado de favoritos":"Agregado a favoritos")}),$(a,"click","[data-quickview]",(b,c)=>{const f=e.products.find(h=>h.id===c.dataset.quickview);if(!f)return;d.innerHTML=We(f),document.body.style.overflow="hidden";const m=()=>{d.innerHTML="",document.body.style.overflow=""};d.querySelector("#close-quickview").addEventListener("click",m),d.querySelector("#quick-view-modal").addEventListener("click",h=>{h.target.id==="quick-view-modal"&&m()}),d.querySelector("#qv-add-to-cart").addEventListener("click",()=>{const h=d.querySelector("#qv-size").value,v=d.querySelector("#qv-color").value;R({productId:f.id,size:h,color:v,qty:1}),g("Producto agregado al carrito"),m()})}),$(a,"click","[data-add-to-cart]",(b,c)=>{var j,z;const f=c.getAttribute("data-product-id"),m=c.closest("article"),h=((j=m==null?void 0:m.querySelector('select[name="size"]'))==null?void 0:j.value)||"",v=((z=m==null?void 0:m.querySelector('select[name="color"]'))==null?void 0:z.value)||"";R({productId:f,size:h,color:v,qty:1});const k=c.innerHTML;c.innerHTML="✓ Agregado",c.classList.add("bg-brand"),c.classList.remove("bg-black"),g("Producto agregado al carrito"),setTimeout(()=>{c.innerHTML=k,c.classList.remove("bg-brand"),c.classList.add("bg-black")},1500)})}}}function Xe(e){var s;const r=I(e.productId);if(!r)return"";const t=(r.price||0)*(Number(e.qty)||0),i=((s=r.images)==null?void 0:s[0])||"https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=100&h=100&fit=crop";return`
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
          <div class="text-sm font-semibold text-gray-900 dark:text-white">${w(t)}</div>
        </div>
      </div>
    </div>
  `}function Ue(e){return{title:"Carrito | G&L",html:`
      <!-- Header -->
      <section class="mb-4">
        <a href="#/catalog" class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Seguir comprando
        </a>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Carrito (${e.cart.reduce((t,i)=>t+(Number(i.qty)||0),0)})</h1>
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
    `,onMount(t){const i=l(t,"#cart-list"),s=l(t,"#cart-total"),a=t.querySelector("#cart-total-final");(()=>{e.cart.length?i.innerHTML=e.cart.map(Xe).join(""):i.innerHTML=`
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
          `;const d=W();s.textContent=w(d),a&&(a.textContent=w(d))})();const o=d=>{var u;return(u=d.closest("[data-cart-item]"))==null?void 0:u.getAttribute("data-key")};$(t,"click","[data-remove]",(d,u)=>{const g=o(u);g&&Ce(g)}),$(t,"click","[data-qty-minus]",(d,u)=>{const g=u.closest("[data-cart-item]"),x=g==null?void 0:g.getAttribute("data-key"),b=g==null?void 0:g.querySelector("[data-qty]");if(!x||!(b instanceof HTMLInputElement))return;const c=Math.max(1,Number(b.value||1)-1);V(x,c)}),$(t,"click","[data-qty-plus]",(d,u)=>{const g=u.closest("[data-cart-item]"),x=g==null?void 0:g.getAttribute("data-key"),b=g==null?void 0:g.querySelector("[data-qty]");if(!x||!(b instanceof HTMLInputElement))return;const c=Math.max(1,Number(b.value||1)+1);V(x,c)}),$(t,"change","[data-qty]",(d,u)=>{const g=u.closest("[data-cart-item]"),x=g==null?void 0:g.getAttribute("data-key");!x||!(u instanceof HTMLInputElement)||V(x,Number(u.value||1))})}}}function Qe({customer:e,cartLines:r,subtotal:t,discount:i,couponCode:s,total:a}){const n=[];n.push("🛒 G&L - Nuevo pedido"),n.push(""),n.push(`👤 Cliente: ${e.name}`),n.push(`📱 WhatsApp: ${e.whatsapp}`),n.push(`💳 Pago: ${e.paymentMethod}`),n.push(`🚚 Entrega: ${e.deliveryMethod}`),e.address&&n.push(`📍 Dirección: ${e.address}`),n.push(""),n.push("📦 Productos:");for(const o of r){const d=[o.size?`Talla ${o.size}`:null,o.color?`Color ${o.color}`:null].filter(Boolean).join(" | "),u=`${o.qty} x ${o.name}`,g=d?` (${d})`:"",x=`${w(o.price)} = ${w(o.subtotal)}`;n.push(`  • ${u}${g} — ${x}`)}return n.push(""),t&&t!==a&&n.push(`Subtotal: ${w(t)}`),s&&i>0&&n.push(`🏷️ Cupón: ${s} (-${w(i)})`),n.push(`💰 Total: ${w(a)}`),n.join(`
`)}function Je(e){const r=encodeURIComponent(e),t=`https://wa.me/${he}?text=${r}`;window.location.assign(t)}function ne(e,r){return e==="Transferencia"&&r==="Envío a domicilio"}function Ke(e){const r=W(),t=se(),i=t?r*(t.discount||0):0,s=r-i,a=(t==null?void 0:t.freeShipping)||r>=B.freeShippingMin;return{title:"Checkout | G&L",html:`
      <section class="mb-5">
        <a href="#/cart" class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver al carrito
        </a>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>
      </section>

      <!-- Order Summary -->
      <section class="mb-5 rounded-xl bg-gray-100 dark:bg-gray-900 p-4">
        <div class="text-xs text-gray-500 dark:text-gray-400 mb-3">Resumen del pedido</div>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">${e.cart.reduce((o,d)=>o+(Number(d.qty)||0),0)} productos</span>
            <span class="text-gray-900 dark:text-white">${w(r)}</span>
          </div>
          ${t?`
          <div class="flex justify-between text-brand">
            <span class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
              ${t.code}
            </span>
            <span>-${w(i)}</span>
          </div>
          `:""}
          <div class="flex justify-between">
            <span class="text-gray-500 dark:text-gray-400">Envío</span>
            <span class="${a?"text-brand":"text-gray-500 dark:text-gray-400"}">${a?"GRATIS":"Por calcular"}</span>
          </div>
          <div class="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
            <span class="font-semibold text-gray-900 dark:text-white">Total</span>
            <span class="text-lg font-bold text-gray-900 dark:text-white">${w(s)}</span>
          </div>
        </div>
      </section>

      <!-- Coupon -->
      <section class="mb-5 rounded-xl bg-gray-100 dark:bg-gray-900 p-4">
        <div class="text-xs text-gray-500 dark:text-gray-400 mb-3">¿Tienes un cupón?</div>
        ${t?`
          <div class="flex items-center justify-between bg-brand/10 border border-brand/30 rounded-lg p-3">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              <div>
                <p class="text-sm font-medium text-brand">${t.code}</p>
                <p class="text-xs text-brand/70">${t.label}</p>
              </div>
            </div>
            <button id="remove-coupon" class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Quitar</button>
          </div>
        `:`
          <div class="flex gap-2">
            <input id="coupon-input" type="text" placeholder="Código de cupón" class="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-600 focus:outline-none uppercase"/>
            <button id="apply-coupon" class="px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black text-sm font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">Aplicar</button>
          </div>
          <p id="coupon-error" class="hidden text-xs text-red-500 mt-2"></p>
          <p class="text-xs text-gray-500 mt-2">Prueba: WELCOME10, VERANO20</p>
        `}
      </section>

      <!-- Form -->
      <section class="rounded-xl bg-gray-100 dark:bg-gray-900 p-5 mb-6">
        <div class="text-xs text-gray-500 dark:text-gray-400 mb-4">Información de contacto</div>

        <form id="checkout-form" class="space-y-4" novalidate>
          <div>
            <label class="block text-xs text-gray-500 mb-1.5">Nombre completo</label>
            <input name="name" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-600 focus:outline-none" placeholder="Tu nombre" />
          </div>

          <div>
            <label class="block text-xs text-gray-500 mb-1.5">WhatsApp</label>
            <input name="whatsapp" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-600 focus:outline-none" inputmode="tel" placeholder="+52 55 1234 5678" />
          </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-gray-500 mb-1.5">Pago</label>
              <select name="paymentMethod" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white focus:border-gray-400 dark:focus:border-gray-600 focus:outline-none">
                <option value="">Seleccionar</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Pago al recoger">Efectivo</option>
              </select>
            </div>

            <div>
              <label class="block text-xs text-gray-500 mb-1.5">Entrega</label>
              <select name="deliveryMethod" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white focus:border-gray-400 dark:focus:border-gray-600 focus:outline-none">
                <option value="">Seleccionar</option>
                <option value="Recoger en tienda">Recoger</option>
                <option value="Envío a domicilio">Envío</option>
              </select>
            </div>
          </div>

          <div id="address-wrap" class="hidden">
            <label class="block text-xs text-gray-500 mb-1.5">Dirección de envío</label>
            <textarea
              name="address"
              rows="2"
              class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-600 focus:outline-none resize-none"
              placeholder="Calle, número, colonia, C.P."
            ></textarea>
          </div>

          <div id="form-error" class="hidden rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500"></div>

          <button
            type="submit"
            class="flex items-center justify-center gap-2 w-full rounded-lg bg-green-500 hover:bg-green-600 px-4 py-3.5 text-sm font-semibold text-white transition-colors"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            </svg>
            Enviar por WhatsApp
          </button>
        </form>
      </section>

      <!-- Trust -->
      <section class="flex justify-center gap-6 py-4">
        <div class="text-center">
          <div class="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <span class="text-xs text-gray-500">Seguro</span>
        </div>
        <div class="text-center">
          <div class="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <span class="text-xs text-gray-500">Rápido</span>
        </div>
        <div class="text-center">
          <div class="w-10 h-10 mx-auto mb-2 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <span class="text-xs text-gray-500">Sin pago online</span>
        </div>
      </section>
    `,onMount(o){const d=l(o,"#checkout-form"),u=l(o,"#address-wrap"),g=l(o,"#form-error"),x=l(o,"#coupon-input"),b=l(o,"#apply-coupon"),c=l(o,"#remove-coupon"),f=l(o,"#coupon-error");b&&x&&(b.addEventListener("click",()=>{const v=x.value.trim().toUpperCase();if(!v)return;const k=Pe(v);k.success?window.dispatchEvent(new CustomEvent("navigate")):(f.textContent=k.message||"Cupón inválido",f.classList.remove("hidden"))}),x.addEventListener("keypress",v=>{v.key==="Enter"&&(v.preventDefault(),b.click())})),c&&c.addEventListener("click",()=>{Be(),window.dispatchEvent(new CustomEvent("navigate"))});const m=()=>{const v=l(o,'select[name="paymentMethod"]').value,k=l(o,'select[name="deliveryMethod"]').value;u.classList.toggle("hidden",!ne(v,k))},h=v=>{if(!v){g.classList.add("hidden"),g.textContent="";return}g.textContent=v,g.classList.remove("hidden")};m(),$(o,"change",'select[name="paymentMethod"],select[name="deliveryMethod"]',()=>{h(""),m()}),d.addEventListener("submit",v=>{if(v.preventDefault(),h(""),!e.cart.length){h("Tu carrito está vacío. Volvé al catálogo para agregar productos.");return}const k=l(o,'input[name="name"]').value.trim(),j=l(o,'input[name="whatsapp"]').value.trim(),z=l(o,'select[name="paymentMethod"]').value,H=l(o,'select[name="deliveryMethod"]').value,Q=l(o,'textarea[name="address"]').value.trim();if(!k)return h("Ingresá tu nombre.");if(!j)return h("Ingresá tu WhatsApp.");if(!z)return h("Seleccioná un método de pago.");if(!H)return h("Seleccioná un método de entrega.");const J=ne(z,H);if(J&&!Q)return h("Ingresá tu dirección completa.");const pe=e.cart.map(q=>{const N=I(q.productId);if(!N)return null;const Y=Number(q.qty)||0,Z=Number(N.price)||0;return{name:N.name,type:N.type,size:q.size,color:q.color,qty:Y,price:Z,subtotal:Y*Z}}).filter(Boolean),O=W(),E=se(),K=E?O*(E.discount||0):0,me=O-K,xe=Qe({customer:{name:k,whatsapp:j,paymentMethod:z,deliveryMethod:H,address:J?Q:""},cartLines:pe,subtotal:O,discount:K,couponCode:(E==null?void 0:E.code)||null,total:me});Je(xe)})}}}function Ye(e){var s;const r=((s=e.images)==null?void 0:s[0])||"https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=200&h=200&fit=crop",t=(e.sizes||[]).map(a=>`<option value="${a}">${a}</option>`).join(""),i=(e.colors||[]).map(a=>`<option value="${a}">${a}</option>`).join("");return`
    <div class="flex gap-4 py-4 border-b border-gray-200 dark:border-gray-800" data-wishlist-item data-id="${e.id}">
      <div class="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
        <img src="${r}" alt="${e.name}" class="w-full h-full object-cover"/>
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <h3 class="text-sm font-medium text-gray-900 dark:text-white truncate">${e.name}</h3>
            <p class="text-xs text-gray-500">${e.type}</p>
          </div>
          <button data-remove="${e.id}" class="p-1 text-gray-400 hover:text-red-500 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="flex items-center gap-2 mt-2">
          <span class="text-base font-bold text-gray-900 dark:text-white">${w(e.price)}</span>
          ${e.originalPrice?`<span class="text-xs text-gray-500 line-through">${w(e.originalPrice)}</span>`:""}
        </div>
        <div class="flex gap-2 mt-3">
          <select class="flex-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-900 dark:text-white" name="size">${t}</select>
          <select class="flex-1 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-900 dark:text-white" name="color">${i}</select>
          <button data-add-cart="${e.id}" class="px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
            Agregar
          </button>
        </div>
      </div>
    </div>
  `}function Ze(e){const r=je();return{title:"Favoritos | G&L",html:`
      <section class="mb-4">
        <a href="#/catalog" class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Catálogo
        </a>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Favoritos</h1>
        <p class="text-sm text-gray-500 mt-1">${r.length} productos guardados</p>
      </section>

      <section id="wishlist-container">
        ${r.length===0?`
          <div class="text-center py-16">
            <div class="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg class="w-10 h-10 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Sin favoritos aún</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Guarda productos que te gusten para verlos después</p>
            <a href="#/catalog" class="inline-flex items-center gap-2 rounded-full bg-black dark:bg-white px-6 py-3 text-sm font-semibold text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
              Explorar catálogo
            </a>
          </div>
        `:r.map(Ye).join("")}
      </section>

      <div id="toast-container" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"></div>
    `,onMount(t){const i=l(t,"#wishlist-container"),s=l(t,"#toast-container"),a=n=>{const o=document.createElement("div");o.className="toast-enter bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium flex items-center gap-2",o.innerHTML=`<svg class="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>${n}`,s.appendChild(o),setTimeout(()=>{o.classList.add("toast-exit"),setTimeout(()=>o.remove(),300)},2e3)};$(t,"click","[data-remove]",(n,o)=>{const d=o.dataset.remove;X(d);const u=i.querySelector(`[data-id="${d}"]`);u&&(u.style.opacity="0",u.style.transform="translateX(-20px)",setTimeout(()=>u.remove(),200)),a("Eliminado de favoritos")}),$(t,"click","[data-add-cart]",(n,o)=>{var b,c;const d=o.dataset.addCart,u=i.querySelector(`[data-id="${d}"]`),g=((b=u==null?void 0:u.querySelector('select[name="size"]'))==null?void 0:b.value)||"",x=((c=u==null?void 0:u.querySelector('select[name="color"]'))==null?void 0:c.value)||"";R({productId:d,size:g,color:x,qty:1}),o.textContent="✓ Agregado",o.disabled=!0,a("Producto agregado al carrito"),setTimeout(()=>{o.textContent="Agregar",o.disabled=!1},1500)})}}}function ge(){return{title:"Login vendedores | G&L",html:`
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
    `,onMount(e){const r=l(e,"#admin-login"),t=l(e,"#admin-error"),i=s=>{if(!s){t.classList.add("hidden"),t.textContent="";return}t.textContent=s,t.classList.remove("hidden")};r.addEventListener("submit",s=>{s.preventDefault(),i("");const a=l(e,'input[name="user"]').value.trim(),n=l(e,'input[name="pass"]').value;if(!a||!n){i("Completá usuario y contraseña.");return}if(!Le(a,n)){i("Credenciales inválidas.");return}P("/admin/products")}),$(e,"click","#admin-logout",()=>{})}}}function ie(e){return e.split(",").map(r=>r.trim()).filter(Boolean)}function et(e){return`
    <div class="flex items-center gap-3 py-3 border-b border-gray-800 last:border-0" data-product data-id="${e.id}">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-500">${e.type}</span>
          <span class="text-xs text-green-400">${w(e.price)}</span>
        </div>
        <div class="text-sm font-medium text-white truncate">${e.name}</div>
        <div class="flex gap-1 mt-1 text-xs text-gray-500">
          <span>${e.sizes.join(", ")}</span>
          <span>·</span>
          <span>${e.colors.join(", ")}</span>
        </div>
      </div>
      <div class="flex gap-2 flex-shrink-0">
        <button type="button" class="p-2 text-gray-400 hover:text-white transition-colors" data-edit>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
        <button type="button" class="p-2 text-gray-400 hover:text-red-400 transition-colors" data-delete>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    </div>
  `}function tt(e){return{title:"Productos | Admin",html:`
      <!-- Header -->
      <section class="mb-5">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-white">Productos</h1>
          <button type="button" id="admin-logout-btn" class="text-xs text-gray-400 hover:text-white transition-colors">
            Cerrar sesión
          </button>
        </div>
        <p class="text-sm text-gray-500">${e.products.length} productos</p>
      </section>

      <!-- Form -->
      <section class="rounded-xl bg-gray-900 p-5 mb-6">
        <div class="text-xs text-gray-500 mb-4">Agregar producto</div>
        
        <form id="product-form" class="space-y-3" novalidate>
          <input type="hidden" name="id" />

          <input name="name" class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-gray-600 focus:outline-none" placeholder="Nombre del producto" />

          <div class="grid grid-cols-2 gap-3">
            <input name="type" class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-gray-600 focus:outline-none" placeholder="Tipo (ej: Camisas)" />
            <input name="price" type="number" min="0" inputmode="numeric" class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-gray-600 focus:outline-none" placeholder="Precio" />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <input name="sizes" class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-gray-600 focus:outline-none" placeholder="Tallas: S, M, L" />
            <input name="colors" class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-gray-600 focus:outline-none" placeholder="Colores: Negro, Blanco" />
          </div>

          <div id="product-error" class="hidden rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400"></div>

          <div class="flex gap-2">
            <button type="submit" class="flex-1 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-gray-100 transition-colors">
              Guardar
            </button>
            <button type="button" id="product-reset" class="rounded-lg border border-gray-700 px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors">
              Limpiar
            </button>
          </div>
        </form>
      </section>

      <!-- List -->
      <section class="rounded-xl bg-gray-900 p-4">
        <div class="text-xs text-gray-500 mb-3">Lista de productos</div>
        <div id="products-list"></div>
      </section>
    `,onMount(t){const i=l(t,"#products-list"),s=l(t,"#product-form"),a=l(t,"#product-error"),n=l(t,"#product-reset"),o=x=>{if(!x){a.classList.add("hidden"),a.textContent="";return}a.textContent=x,a.classList.remove("hidden")},d=()=>{if(!e.products.length){i.innerHTML=`
            <div class="text-center py-8 text-gray-500 text-sm">
              No hay productos. Agrega el primero arriba.
            </div>
          `;return}i.innerHTML=e.products.map(et).join("")},u=()=>{s.reset(),l(t,'input[name="id"]').value="",o("")};d(),l(t,"#admin-logout-btn").addEventListener("click",()=>{ae(),P("/admin")}),n.addEventListener("click",()=>u()),s.addEventListener("submit",x=>{x.preventDefault(),o("");const b=l(t,'input[name="id"]'),c=l(t,'input[name="name"]').value.trim(),f=l(t,'input[name="type"]').value.trim(),m=Number(l(t,'input[name="price"]').value||0),h=ie(l(t,'input[name="sizes"]').value),v=ie(l(t,'input[name="colors"]').value);if(!c)return o("Ingresá el nombre del producto.");if(!f)return o("Ingresá el tipo de prenda.");if(!Number.isFinite(m)||m<=0)return o("Ingresá un precio válido mayor a 0.");if(!h.length)return o("Ingresá al menos una talla.");if(!v.length)return o("Ingresá al menos un color.");const k=[...e.products];if(b.value){const j=k.findIndex(z=>z.id===b.value);if(j===-1)return o("No se encontró el producto a editar.");k[j]={...k[j],name:c,type:f,price:m,sizes:h,colors:v}}else{const j=`p-${crypto.randomUUID()}`;k.unshift({id:j,name:c,type:f,price:m,sizes:h,colors:v})}re(k),u(),P("/admin/products")}),$(t,"click","[data-edit]",(x,b)=>{const c=b.closest("[data-product]"),f=c==null?void 0:c.getAttribute("data-id"),m=e.products.find(h=>h.id===f);m&&(l(t,'input[name="id"]').value=m.id,l(t,'input[name="name"]').value=m.name,l(t,'input[name="type"]').value=m.type,l(t,'input[name="price"]').value=String(m.price),l(t,'input[name="sizes"]').value=m.sizes.join(", "),l(t,'input[name="colors"]').value=m.colors.join(", "))}),$(t,"click","[data-delete]",(x,b)=>{const c=b.closest("[data-product]"),f=c==null?void 0:c.getAttribute("data-id");if(!f)return;const m=e.products.filter(h=>h.id!==f);re(m)}),$(t,"click","#admin-logout",()=>{ae(),P("/admin/login")})}}}const rt={"/":de,"/catalog":Fe,"/cart":Ue,"/checkout":Ke,"/wishlist":Ze},at={"/admin/login":ge,"/admin/products":tt};function st(e,r){const t=e.startsWith("/admin"),a=((t?at:rt)[e]||(t?ge:de))(r),n=a.title;return t?{title:n,html:Ie({contentHtml:a.html,state:r}),onMount:a.onMount}:{title:n,html:Te({contentHtml:a.html,state:r,showSearch:a.showSearch}),onMount:a.onMount}}function ot(e){fe(),$e();const r=()=>{const o=Se();document.documentElement.classList.toggle("dark",o==="dark"),document.body.classList.toggle("bg-black",o==="dark"),document.body.classList.toggle("bg-white",o==="light")};r();const t=o=>{const d=Me();if(d&&!o.startsWith("/admin")){P("/admin/products");return}if(!d&&o.startsWith("/admin")&&o!=="/admin/login"){P("/admin/login");return}const{title:u,html:g,onMount:x}=st(o,F());document.title=u,e.innerHTML=g,x==null||x(e),i()},i=()=>{const o=document.getElementById("theme-toggle");o&&o.addEventListener("click",()=>{ze(),r(),t(A())});const d=document.getElementById("global-search");d&&d.addEventListener("keypress",u=>{if(u.key==="Enter"){const g=u.target.value.trim();le(g),P("/catalog")}}),window.addEventListener("navigate",()=>t(A()),{once:!0})},s=ye(t),a=we();t(A());const n=ke(()=>t(A()));return()=>{a(),s(),n()}}ot(document.querySelector("#app"));
