import{o as e,r as t,t as n}from"./auth-wBsPwwBl.js";function r(r){let i=document.getElementById(`_user-dropdown`);i&&i.remove();let a=r.user_metadata?.full_name??r.email?.split(`@`)[0]??`User`,o=a.split(` `).map(e=>e[0]).join(``).toUpperCase().slice(0,2),s=document.createElement(`div`);s.className=`user-dropdown`,s.id=`_user-dropdown`,s.innerHTML=`
    <div class="user-trigger" id="_user-trigger" title="Account settings">
      <div class="user-avatar-small">${o}</div>
      <div class="user-name-small">${a}</div>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="opacity:0.5;margin-left:-4px"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
    <div class="dropdown-menu" id="_user-menu">
      <div class="dropdown-header">
        <div class="dropdown-user-name">${a}</div>
        <div class="dropdown-user-role">${document.title.includes(`Teacher`)?`Teacher Portal`:`Student Portal`}</div>
      </div>
      <div id="_user-menu-items">
        <!-- Other modules can inject items here -->
      </div>
      <button class="dropdown-item logout" id="_logout-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span>Logout</span>
      </button>
    </div>
  `;let c=document.getElementById(`nav-actions`)||document.querySelector(`.nav-inner`);c?c.appendChild(s):document.body.appendChild(s),document.getElementById(`_user-trigger`)?.addEventListener(`click`,e=>{e.stopPropagation(),s.classList.toggle(`open`)}),document.addEventListener(`click`,e=>{s.contains(e.target)||s.classList.remove(`open`)});let l=!1;document.getElementById(`_logout-btn`)?.addEventListener(`click`,async r=>{if(r.stopPropagation(),l)return;l=!0;let i=r.currentTarget;i.disabled=!0,i.innerHTML=`
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="animation:am-spin .7s linear infinite">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <span>Signing out…</span>`;try{await e.auth.signOut()}catch{}t(()=>window.location.replace(n.login))});let u=document.getElementById(`mobile-menu`);if(u&&!document.getElementById(`_mobile-logout-btn`)){let e=document.createElement(`div`);e.className=`dropdown-divider-mobile`,e.style.margin=`12px 16px`,e.style.height=`1px`,e.style.background=`rgba(255,255,255,0.08)`;let t=document.createElement(`a`);t.id=`_mobile-logout-btn`,t.className=`mob-link logout-mob`,t.style.color=`#f87171`,t.innerHTML=`<i data-lucide="log-out"></i>Logout`,t.onclick=()=>{let e=document.getElementById(`_logout-btn`);e&&e.click()},u.appendChild(e),u.appendChild(t);let n=window;n.lucide&&n.lucide.createIcons()}}export{r as t};