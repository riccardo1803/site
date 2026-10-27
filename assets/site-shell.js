
    (function(){
      var root=document.documentElement;
      var appearances=['system','light','dark'];
      // Same storage key as Interactive Research (shared on the same domain).
      var stored=null;
      try{stored=localStorage.getItem('ir-appearance') || localStorage.getItem('rm-site-appearance');}catch(e){}
      var appearance=appearances.includes(stored)?stored:'system';
      var system=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;
      function updateAppearance(){
        var dark=appearance==='dark'||(appearance==='system'&&!!(system&&system.matches));
        root.dataset.appearance=appearance;
        root.dataset.theme=dark?'dark':'light';
        var favicon=document.getElementById('site-favicon');if(favicon)favicon.setAttribute('href','assets/favicon-mitch-'+(dark?'dark':'light')+'.svg?v=124');
        appearances.forEach(function(a){var button=document.getElementById('theme-'+a);button.setAttribute('aria-pressed',String(a===appearance));});
      }
      appearances.forEach(function(a){document.getElementById('theme-'+a).addEventListener('click',function(){
        appearance=a;
        try{localStorage.setItem('ir-appearance',a);localStorage.setItem('rm-site-appearance',a);}catch(e){}
        updateAppearance();
      });});
      if(system){if(system.addEventListener)system.addEventListener('change',function(){if(appearance==='system')updateAppearance();});else if(system.addListener)system.addListener(function(){if(appearance==='system')updateAppearance();});}
      updateAppearance();
      var navToggle=document.getElementById('navToggle');
      function closeMenu(){document.body.classList.remove('nav-open');navToggle.setAttribute('aria-expanded','false');navToggle.setAttribute('aria-label','Open navigation');}
      navToggle.addEventListener('click',function(){var isOpen=document.body.classList.toggle('nav-open');navToggle.setAttribute('aria-expanded',String(isOpen));navToggle.setAttribute('aria-label',isOpen?'Close navigation':'Open navigation');});
      document.querySelectorAll('.nav-link,.brand').forEach(function(link){link.addEventListener('click',closeMenu);});
      document.addEventListener('keydown',function(e){if(e.key==='Escape')closeMenu();});
      document.addEventListener('click',function(e){if(document.body.classList.contains('nav-open')&&!e.target.closest('.sidebar')&&!e.target.closest('#navToggle'))closeMenu();});
    })();
  