/**
 * catalogCarousels.js
 * Gestión de carruseles de imágenes:
 *   - initCarousels()       → carruseles en las tarjetas del grid
 *   - initModalCarousel()   → carrusel con thumbs, dots y touch-swipe del modal de detalle
 *   - initModalZoom()       → zoom en hover (desktop) y pinch-to-zoom (mobile) del modal
 */

import { lockScroll, unlockScroll } from '../../utils/dom.js'

// ── Grid card carousels ──────────────────────────────────────────────────────

/**
 * Inicializa todos los carruseles de tarjetas presentes en el grid.
 * @param {NodeList} carousels - elementos [data-carousel]
 */
export function initCarousels(carousels) {
  carousels.forEach(carousel => {
    const track = carousel.querySelector('[data-track]')
    const slides = carousel.querySelectorAll('[data-slide]')
    const prevBtn = carousel.querySelector('[data-prev]')
    const nextBtn = carousel.querySelector('[data-next]')
    const dots = carousel.querySelectorAll('[data-dot]')

    let currentIndex = 0

    const updateCarousel = () => {
      track.style.transform = `translateX(-${currentIndex * 100}%)`
      dots.forEach((dot, i) => {
        if (i === currentIndex) {
          dot.classList.add('bg-white')
          dot.classList.remove('bg-white/60')
        } else {
          dot.classList.remove('bg-white')
          dot.classList.add('bg-white/60')
        }
      })
    }

    prevBtn?.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      currentIndex = (currentIndex - 1 + slides.length) % slides.length
      updateCarousel()
    })

    nextBtn?.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      currentIndex = (currentIndex + 1) % slides.length
      updateCarousel()
    })

    dots.forEach((dot, i) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        currentIndex = i
        updateCarousel()
      })
    })
  })
}

// ── Modal carousel (thumbnails + dots + counter + touch swipe) ───────────────

/**
 * Inicializa el carrusel del modal de quick-view.
 * @param {HTMLElement} modalCarousel - elemento [data-modal-carousel]
 */
export function initModalCarousel(modalCarousel) {
  if (!modalCarousel) return

  const track = modalCarousel.querySelector('[data-modal-track]')
  const slides = modalCarousel.querySelectorAll('[data-modal-slide]')
  const prevBtn = modalCarousel.querySelector('[data-modal-prev]')
  const nextBtn = modalCarousel.querySelector('[data-modal-next]')
  const thumbs = modalCarousel.querySelectorAll('[data-modal-thumb]')
  const dots = modalCarousel.querySelectorAll('[data-modal-dot]')
  const counter = modalCarousel.querySelector('[data-modal-counter]')

  let currentIndex = 0

  const updateModalCarousel = () => {
    track.style.transform = `translateX(-${currentIndex * 100}%)`
    thumbs.forEach((thumb, i) => {
      if (i === currentIndex) {
        thumb.classList.remove('border-white/40')
        thumb.classList.add('border-white')
      } else {
        thumb.classList.remove('border-white')
        thumb.classList.add('border-white/40')
      }
    })
    dots.forEach((dot, i) => {
      if (i === currentIndex) {
        dot.classList.remove('bg-white/50')
        dot.classList.add('bg-white', 'shadow-md')
      } else {
        dot.classList.remove('bg-white', 'shadow-md')
        dot.classList.add('bg-white/50')
      }
    })
    if (counter) counter.textContent = `${currentIndex + 1} / ${slides.length}`
  }

  prevBtn?.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    currentIndex = (currentIndex - 1 + slides.length) % slides.length
    updateModalCarousel()
  })

  nextBtn?.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    currentIndex = (currentIndex + 1) % slides.length
    updateModalCarousel()
  })

  thumbs.forEach((thumb, i) => {
    thumb.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      currentIndex = i
      updateModalCarousel()
    })
  })

  // Touch swipe
  let touchStartX = 0
  let touchStartY = 0
  let isSwiping = false

  modalCarousel.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
    isSwiping = false
  }, { passive: true })

  modalCarousel.addEventListener('touchmove', (e) => {
    const diffX = Math.abs(e.touches[0].clientX - touchStartX)
    const diffY = Math.abs(e.touches[0].clientY - touchStartY)
    if (diffX > diffY && diffX > 10) {
      isSwiping = true
      e.preventDefault()
    }
  }, { passive: false })

  modalCarousel.addEventListener('touchend', (e) => {
    if (!isSwiping) return
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX - touchEndX
    if (Math.abs(diff) > 40) {
      if (diff > 0 && currentIndex < slides.length - 1) {
        currentIndex++
      } else if (diff < 0 && currentIndex > 0) {
        currentIndex--
      }
      updateModalCarousel()
    }
  }, { passive: true })
}

// ── Modal image zoom (desktop hover + mobile pinch) ──────────────────────────

/**
 * Inicializa el zoom de imágenes en el modal de quick-view.
 * - En el carrusel multi-imagen, aplica zoom solo al slide activo.
 * - Al navegar entre slides, resetea el zoom del slide anterior.
 * @param {HTMLElement} modalContainer - contenedor del modal
 */
export function initModalZoom(modalContainer) {
  const imageContainers = [
    modalContainer.querySelector('[data-modal-carousel]'),
    modalContainer.querySelector('[data-modal-single]'),
  ].filter(Boolean)

  imageContainers.forEach(container => {
    if (!container) return

    const track    = container.querySelector('[data-modal-track]')
    const allImgs  = container.querySelectorAll('.modal-img-zoomable')
    let isZoomLocked = false

    // Devuelve la imagen del slide activo.
    // Para carrusel: lee el translateX del track para saber qué index está visible.
    // Para imagen única: devuelve la única imagen.
    const getActiveImg = () => {
      if (!track) return allImgs[0] || null
      const match = track.style.transform.match(/translateX\(-?([0-9.]+)%\)/)
      const idx   = match ? Math.round(parseFloat(match[1]) / 100) : 0
      return allImgs[idx] || allImgs[0] || null
    }

    // Resetea el zoom de todas las imágenes (se llama al navegar o al salir)
    const resetZoom = (exceptImg = null) => {
      allImgs.forEach(img => {
        if (img === exceptImg) return
        img.style.transform = 'scale(1)'
        img.style.transformOrigin = 'center'
      })
    }

    // Desktop: hover + mousemove zoom
    const handleMouseMove = (e) => {
      const img = getActiveImg()
      if (!img) return
      const rect = container.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      img.style.transformOrigin = `${x}% ${y}%`
      if (!isZoomLocked) {
        img.style.transform = 'scale(1.5)'
        container.style.cursor = 'zoom-out'
      }
    }

    const handleMouseLeave = () => {
      if (isZoomLocked) return
      const img = getActiveImg()
      if (img) {
        img.style.transform = 'scale(1)'
        img.style.transformOrigin = 'center'
      }
      container.style.cursor = 'zoom-in'
    }

    const handleClick = (e) => {
      if (e.target.closest('[data-modal-prev], [data-modal-next], [data-modal-thumb]')) return
      const img = getActiveImg()
      if (!img) return
      isZoomLocked = !isZoomLocked
      if (isZoomLocked) {
        container.style.cursor = 'grab'
      } else {
        img.style.transform = 'scale(1)'
        img.style.transformOrigin = 'center'
        container.style.cursor = 'zoom-in'
      }
    }

    if (window.innerWidth >= 768) {
      container.addEventListener('mousemove', handleMouseMove)
      container.addEventListener('mouseleave', handleMouseLeave)
      container.addEventListener('click', handleClick)
    }

    // Resetear zoom al navegar entre slides (prev / next / thumbs)
    const navBtns = container.querySelectorAll('[data-modal-prev], [data-modal-next], [data-modal-thumb]')
    navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        isZoomLocked = false
        container.style.cursor = 'zoom-in'
        // Pequeño delay para que updateModalCarousel mueva el track primero
        requestAnimationFrame(() => resetZoom())
      })
    })

    // Mobile: pinch-to-zoom
    let initialDistance = 0
    let initialScale    = 1

    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        const t1 = e.touches[0], t2 = e.touches[1]
        initialDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        const img = getActiveImg()
        if (img) {
          const match = img.style.transform.match(/scale\(([^)]+)\)/)
          initialScale = match ? parseFloat(match[1]) : 1
        }
      }
    }, { passive: false })

    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        e.stopPropagation()
        const t1 = e.touches[0], t2 = e.touches[1]
        const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
        const scale = Math.max(1, Math.min(3, initialScale * (currentDistance / initialDistance)))
        const img = getActiveImg()
        if (img) {
          img.style.transform = `scale(${scale})`
          container.style.cursor = scale > 1 ? 'zoom-out' : 'zoom-in'
        }
      }
    }, { passive: false })

    container.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) initialDistance = 0
    }, { passive: true })

    // Mobile: Tap to open fullscreen viewer
    if (window.innerWidth < 768) {
      container.addEventListener('click', (e) => {
        if (e.target.closest('[data-modal-prev], [data-modal-next], [data-modal-thumb], [data-modal-dot], [data-modal-counter]')) return
        openFullscreenViewer(container, allImgs)
      })
    }
  })
}

// ── Fullscreen Mobile Viewer ────────────────────────────────────────────────

function openFullscreenViewer(container, allImgs) {
  const srcs = Array.from(allImgs).map(img => img.src)
  if (srcs.length === 0) return

  let currentIndex = 0
  const track = container.querySelector('[data-modal-track]')
  if (track) {
    const match = track.style.transform.match(/translateX\(-?([0-9.]+)%\)/)
    if (match) currentIndex = Math.round(parseFloat(match[1]) / 100)
  }

  const viewerHTML = `
    <div id="fs-viewer" class="fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col animate-fade-in">
      <div class="absolute top-0 left-0 right-0 p-4 flex justify-end z-[110]">
        <button id="fs-close" class="w-10 h-10 rounded-full bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur shadow-sm text-gray-800 dark:text-white flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      ${srcs.length > 1 ? `<div class="absolute top-5 left-1/2 -translate-x-1/2 bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur shadow-sm text-gray-800 dark:text-white text-xs font-bold px-3 py-1.5 rounded-full z-[110]" id="fs-counter">${currentIndex + 1} / ${srcs.length}</div>` : ''}

      <div class="relative w-full h-full flex items-center overflow-x-auto snap-x snap-mandatory hide-scrollbar touch-pan-x" id="fs-track">
        ${srcs.map(src => `
          <div class="min-w-full h-full flex items-center justify-center flex-shrink-0 snap-center pb-12 pt-20 px-4">
            <img src="${src}" class="w-full h-full object-contain" />
          </div>
        `).join('')}
      </div>

      ${srcs.length > 1 ? `
        <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-[110]" id="fs-dots">
          ${srcs.map((_, i) => `<span class="w-2 h-2 rounded-full transition-[transform,background-color] duration-200 ${i === currentIndex ? 'bg-gray-900 dark:bg-white scale-110' : 'bg-gray-300 dark:bg-gray-600'}" data-fs-dot="${i}"></span>`).join('')}
        </div>
      ` : ''}
    </div>
  `

  document.body.insertAdjacentHTML('beforeend', viewerHTML)
  const viewer = document.getElementById('fs-viewer')
  const fsTrack = viewer.querySelector('#fs-track')
  const fsClose = viewer.querySelector('#fs-close')
  const fsCounter = viewer.querySelector('#fs-counter')
  const fsDots = viewer.querySelectorAll('[data-fs-dot]')

  lockScroll()

  fsClose.addEventListener('click', () => {
    viewer.classList.replace('animate-fade-in', 'animate-fade-out')
    setTimeout(() => {
      viewer.remove()
      // Si se cerró el modal principal mientras tanto, no restaurar overflow aquí, pero el closeModal del main modal lo hará.
      if (!document.getElementById('quick-view-modal')) unlockScroll()
    }, 200)
  })

  if (srcs.length > 1 && fsTrack) {
    requestAnimationFrame(() => {
      fsTrack.scrollLeft = currentIndex * fsTrack.clientWidth
    })

    fsTrack.addEventListener('scroll', () => {
      const calculatedIdx = Math.round(fsTrack.scrollLeft / fsTrack.clientWidth)
      // Prevenir bug visual de rubber-banding en iOS donde idx < 0 o idx >= length
      const idx = Math.max(0, Math.min(srcs.length - 1, calculatedIdx))
      
      if (fsCounter) fsCounter.textContent = `${idx + 1} / ${srcs.length}`
      fsDots.forEach((dot, i) => {
        if (i === idx) {
          dot.className = 'w-2 h-2 rounded-full transition-[transform,background-color] duration-200 bg-gray-900 dark:bg-white scale-110'
        } else {
          dot.className = 'w-2 h-2 rounded-full transition-[transform,background-color] duration-200 bg-gray-300 dark:bg-gray-600'
        }
      })
    })
  }
}

