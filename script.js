document.addEventListener('DOMContentLoaded', () => {
  // --- UTILITIES ---
  function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  // --- SELETORES GLOBAIS ---
  const navBar = document.getElementById('mainNav');
  const navLinks = document.querySelectorAll('nav a.nav-link[href^="#"]');
  const contentSections = document.querySelectorAll('section.content-section[id]');
  const navUl = document.querySelector('nav ul.nav-links');
  const menuToggle = document.querySelector('.menu-toggle');

  // --- FUNÇÃO HELPER PARA FECHAR MENU MOBILE ---
  function closeMobileMenuIfNeeded() {
    if (window.innerWidth <= 600 && navUl && navUl.classList.contains('open') && menuToggle) {
      navUl.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.textContent = '☰ Menu';
    }
  }

  // --- INICIALIZAÇÃO DO MENU HAMBURGUER ---
  function initMenuToggle() {
    if (menuToggle && navUl) {
      menuToggle.addEventListener('click', () => {
        const isOpen = navUl.classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', isOpen.toString());
        menuToggle.textContent = isOpen ? '✕ Fechar' : '☰ Menu';
      });

      window.addEventListener('resize', debounce(() => {
        if (window.innerWidth > 600 && navUl.classList.contains('open')) {
          navUl.classList.remove('open');
          menuToggle.setAttribute('aria-expanded', 'false');
          menuToggle.textContent = '☰ Menu';
        }
      }, 200));
    }
  }

  // --- NAVEGAÇÃO E EXIBIÇÃO DE SEÇÕES ---
  let initialNavOffsetTop = 0;

  function showSection(targetId, isInitialLoad = false) {
    // console.log(`showSection chamada com targetId: ${targetId}, isInitialLoad: ${isInitialLoad}`);
    let sectionToShow = null;
    contentSections.forEach(section => {
      const isActiveSection = section.id === targetId.substring(1);
      section.classList.toggle('active-section', isActiveSection);
      if (isActiveSection) {
        sectionToShow = section;
        // A classe .is-visible será adicionada pelo IntersectionObserver do initScrollReveal
        // Para a primeira carga, se a seção já estiver visível, o observer também a pegará.
        // Se for necessário forçar para a primeira seção *antes* do observer:
        if (isInitialLoad) {
            const rect = section.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom >= 0 && !section.classList.contains('is-visible')) {
                 // O observer deve pegar isso, mas podemos adicionar aqui como garantia
                 // section.classList.add('is-visible');
            }
        }
      }
    });

    navLinks.forEach(link => {
      const isActiveLink = link.getAttribute('href') === targetId;
      link.classList.toggle('active', isActiveLink);
      link.setAttribute('aria-current', isActiveLink ? 'page' : 'false');
    });

    if (isInitialLoad && navLinks.length > 0 && targetId === navLinks[0].getAttribute('href')) {
      // console.log("Rolando para o topo na carga inicial.");
      window.scrollTo({ top: 0, behavior: 'auto' });
      closeMobileMenuIfNeeded();
      return;
    }

    if (sectionToShow) {
      let scrollToPosition = sectionToShow.offsetTop;
      
      if (navBar.classList.contains('sticky')) {
        scrollToPosition -= navBar.offsetHeight;
      } else {
        // Se a navbar não é sticky, mas está acima do topo da viewport
        // E se o initialNavOffsetTop foi calculado
        if (initialNavOffsetTop > 0 && window.pageYOffset < initialNavOffsetTop) {
            scrollToPosition -= initialNavOffsetTop; // Subtrai a posição original da nav
        } else if (navBar.offsetHeight > 0) { 
            // Se a nav está no fluxo normal no topo, subtrai sua altura
            // Esta condição pode ser redundante se initialNavOffsetTop já for a altura
            // scrollToPosition -= navBar.offsetHeight; (Pode causar duplo desconto se initialNavOffsetTop = navBar.offsetHeight)
            // Melhor: se não é sticky e initialNavOffsetTop é a posição da nav,
            // e queremos que a seção apareça *abaixo* dela, então a lógica é:
            // Se a nav está no topo (offsetTop próximo de 0) e não é sticky, subtraia sua altura.
            if(initialNavOffsetTop < navBar.offsetHeight + 5) { // Heurística: se a nav está realmente no topo
                 scrollToPosition -= navBar.offsetHeight;
            }

        }
      }
      
      const finalScrollPosition = Math.max(0, scrollToPosition - 15);
      const scrollBehavior = window.innerWidth <= 600 ? 'auto' : 'smooth';
      
      // console.log(`--- Tentando rolar para: ${targetId} ---`);
      // console.log(`Final scrollTo: top=${finalScrollPosition}, behavior=${scrollBehavior}`);

      window.scrollTo({
        top: finalScrollPosition,
        behavior: scrollBehavior
      });

    } else {
      // console.warn(`Seção com ID "${targetId}" não encontrada.`);
    }
    closeMobileMenuIfNeeded();
  }

  function initSectionNavigation() {
    if (navLinks.length > 0) {
      const firstSectionId = navLinks[0].getAttribute('href');
      showSection(firstSectionId, true);
    } else if (contentSections.length > 0) {
      const firstSectionId = '#' + contentSections[0].id;
      showSection(firstSectionId, true);
    }

    navLinks.forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        showSection(targetId, false);
      });
    });
  }

  // --- NAVEGAÇÃO FIXA (STICKY NAV) ---
  function setInitialNavOffset() {
    if (!navBar) return;
    const wasSticky = navBar.classList.contains('sticky');
    if (wasSticky) navBar.classList.remove('sticky'); // Remove para calcular o offset corretamente
    initialNavOffsetTop = navBar.offsetTop;
    if (wasSticky) navBar.classList.add('sticky'); // Adiciona de volta se estava
  }

  function handleStickyNav() {
    if (!navBar) return;
    if (initialNavOffsetTop > 0 && window.pageYOffset > initialNavOffsetTop) {
      navBar.classList.add('sticky');
    } else {
      navBar.classList.remove('sticky');
    }
  }

  function initStickyNav() {
    if (!navBar) return;
    // Chama setInitialNavOffset após todos os elementos da página (imagens, fontes) terem carregado,
    // o que pode afetar o offsetTop da nav.
    window.addEventListener('load', () => {
        setInitialNavOffset();
        handleStickyNav(); // Verifica o estado sticky no load
    });
    window.addEventListener('resize', debounce(() => {
      setInitialNavOffset();
      handleStickyNav();
    }, 200));
    window.addEventListener('scroll', debounce(handleStickyNav, 50));
    setInitialNavOffset(); // Chamar uma vez para o caso de o evento 'load' já ter disparado
    handleStickyNav(); // E verificar o estado inicial
  }

  // --- SLIDER DE IMAGENS ---
  function initImageSlider() {
    const slider = document.querySelector('.image-slider');
    const slides = Array.from(document.querySelectorAll('.image-slider img'));
    const prevButton = document.querySelector('.slider-button.prev');
    const nextButton = document.querySelector('.slider-button.next');
    const dotsContainer = document.querySelector('.slider-dots');
    
    if (!slider || slides.length === 0) return;
    let currentIndex = 0;
    let autoSlideInterval;

    function createDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.classList.add('dot');
        dot.setAttribute('aria-label', `Ir para imagem ${index + 1}`);
        if (index === currentIndex) dot.classList.add('active');
        dot.addEventListener('click', () => {
          currentIndex = index;
          updateSlider();
          startAutoSlide();
        });
        dotsContainer.appendChild(dot);
      });
    }
    function updateSlider() {
      slider.style.transform = `translateX(-${currentIndex * 100}%)`;
      slides.forEach((slide, index) => slide.classList.toggle('active', index === currentIndex));
      if (dotsContainer) {
        Array.from(dotsContainer.children).forEach((dot, index) => dot.classList.toggle('active', index === currentIndex));
      }
    }
    function nextSlide() {
      currentIndex = (currentIndex + 1) % slides.length;
      updateSlider();
    }
    function prevSlide() {
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      updateSlider();
    }
    function startAutoSlide() {
      stopAutoSlide();
      if (slides.length > 1) {
        autoSlideInterval = setInterval(nextSlide, 4000);
      }
    }
    function stopAutoSlide() {
      clearInterval(autoSlideInterval);
    }
    createDots();
    updateSlider();
    if (prevButton && nextButton) {
      prevButton.addEventListener('click', () => { prevSlide(); startAutoSlide(); });
      nextButton.addEventListener('click', () => { nextSlide(); startAutoSlide(); });
    }
    startAutoSlide();
    const sliderContainer = document.querySelector('.image-slider-container');
    if (sliderContainer) {
      sliderContainer.addEventListener('mouseenter', stopAutoSlide);
      sliderContainer.addEventListener('mouseleave', startAutoSlide);
    }
  }

  // --- ANIMAÇÃO DE SCROLL REVEAL PARA SEÇÕES ---
  function initScrollReveal() {
    const sectionsToReveal = document.querySelectorAll('.content-section');
    if (sectionsToReveal.length === 0) return;

    const revealObserverOptions = {
      threshold: 0.1 // Anima quando 10% da seção está visível
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // observer.unobserve(entry.target); // Descomente para animar apenas uma vez
        } else {
          // Se você quiser que a animação ocorra sempre que a seção reentrar na tela,
          // você pode remover a classe .is-visible aqui.
          // entry.target.classList.remove('is-visible');
        }
      });
    }, revealObserverOptions);

    sectionsToReveal.forEach(section => {
      revealObserver.observe(section);
    });
  }


  // --- CHAMADA DAS FUNÇÕES DE INICIALIZAÇÃO ---
  initMenuToggle();
  initSectionNavigation();
  initStickyNav();     // <--- REATIVADO
  initImageSlider();
  initScrollReveal();  // <--- REATIVADO

  // No evento 'load', o initStickyNav já chama setInitialNavOffset e handleStickyNav.
  // A lógica para .is-visible na primeira seção ativa também já está em showSection.
  // Podemos remover a adição explícita de .is-visible aqui se confiamos no observer ou no showSection.
  /*
  window.addEventListener('load', () => {
    const firstActiveSection = document.querySelector('.content-section.active-section');
    if (firstActiveSection) {
        const rect = firstActiveSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom >= 0 && !firstActiveSection.classList.contains('is-visible')) {
            firstActiveSection.classList.add('is-visible');
        }
    }
  });
  */
});