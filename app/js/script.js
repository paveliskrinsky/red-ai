"use strict";

const assets = document.currentScript.dataset;

document.addEventListener('click', function (e) {
    const toggle = e.target.closest('.js-toggle, .js-parent-toggle');
    if (toggle) {
        if (toggle.classList.contains('js-parent-toggle')) {
            toggle.parentNode.classList.toggle('active');
        } else {
            toggle.classList.toggle('active');
        }
        e.preventDefault();
    }
});

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.append(script);
    });
}

function whenNear(elements, callback) {
    let done = false;
    const run = () => {
        if (done) return;
        done = true;
        observer.disconnect();
        callback();
    };

    const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) run();
    }, { rootMargin: '600px 0px' });

    elements.forEach(element => observer.observe(element));
    return run;
}

function tel() {
    const inputs = document.querySelectorAll('[type=tel]');
    if (!inputs.length) return;

    const load = whenNear(inputs, () => {
        loadScript(assets.imask).then(() => {
            inputs.forEach(input => IMask(input, '+{7} (000) 000-00-00'));
        });
    });

    inputs.forEach(input => input.addEventListener('focus', load, { once: true }));
}

function sliders() {
    const containers = document.querySelectorAll('.js-suite, .js-stories, .js-levers, .js-analytics');
    if (!containers.length) return;

    whenNear(containers, () => {
        loadScript(assets.swiper).then(() => {
            suite();
            stories();
            levers();
            analytics();
        });
    });
}

function header() {
    document.addEventListener('click', (e) => {
        const target = e.target;

        if (target.closest('.js-burger-open')) {
            const headerEl = document.querySelector('.header');
            if (headerEl) {
                document.body.style.setProperty('--header-bottom', `${headerEl.getBoundingClientRect().bottom}px`);
            }
            document.body.classList.toggle('burger-opened');
            e.preventDefault();
        }

        if (target.closest('.js-burger-close')) {
            document.body.classList.remove('burger-opened');
            e.preventDefault();
        }

        if (target.closest('.js-anchor')) {
            document.body.classList.remove('burger-opened');
        }
    });
}

function notify() {
    const key = 'notifyClosedUntil';
    const week = 7 * 24 * 60 * 60 * 1000;

    const root = document.documentElement;
    const setHeight = () => {
        const bar = document.querySelector('.js-notify');
        root.style.setProperty('--notify-height', `${bar ? bar.offsetHeight : 0}px`);
    };

    setHeight();
    document.fonts?.ready.then(setHeight);
    window.addEventListener('resize', setHeight);

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.js-notify-close')) return;

        root.classList.add('notify-closed');
        setHeight();
        try {
            localStorage.setItem(key, Date.now() + week);
        } catch (err) { }
        e.preventDefault();
    });
}

function suite() {
    document.querySelectorAll('.js-suite').forEach(container => {
        const wrap = container.querySelector('.suite__tablist-wrap');
        const tabs = container.querySelectorAll('.suite__tab');

        const swiper = new Swiper(container.querySelector('.swiper'), {
            speed: 500,
            spaceBetween: 24,
            navigation: {
                prevEl: container.querySelector('.suite__nav-button_prev'),
                nextEl: container.querySelector('.suite__nav-button_next'),
            },
            on: {
                slideChange(s) {
                    const tab = tabs[s.activeIndex];
                    tabs.forEach(item => item.classList.toggle('active', item === tab));
                    wrap.scrollTo({ left: tab.offsetLeft - (wrap.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
                },
            },
        });

        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => swiper.slideTo(index));
        });
    });
}

function stories() {
    const desktop = window.matchMedia('(min-width: 798px)');

    document.querySelectorAll('.js-stories').forEach(container => {
        const slides = container.querySelectorAll('.stories__slide');
        const swiper = new Swiper(container.querySelector('.swiper'), {
            slidesPerView: 'auto',
            spaceBetween: 20,
            pagination: {
                el: container.querySelector('.stories__pagination'),
                clickable: true,
            },
            navigation: {
                prevEl: container.querySelector('.stories__nav-button_prev'),
                nextEl: container.querySelector('.stories__nav-button_next'),
            },
        });

        swiper.on('click', (s) => {
            const slide = s.clickedSlide;
            const index = s.clickedIndex;
            if (!desktop.matches || !slide || slide.classList.contains('active')) return;

            slides.forEach(item => item.classList.remove('active'));
            slide.classList.add('active');

            let timer;
            const onEnd = (e) => {
                if (e && (e.target !== slide || e.propertyName !== 'width')) return;
                slide.removeEventListener('transitionend', onEnd);
                clearTimeout(timer);
                swiper.update();
                swiper.slideTo(index);
            };
            slide.addEventListener('transitionend', onEnd);
            timer = setTimeout(onEnd, 400);
        });
    });
}

function expandSlider(container, block, gap = 20) {
    const desktop = window.matchMedia('(min-width: 798px)');
    const desktopGap = 20;
    const el = container.querySelector('.swiper');
    const slides = container.querySelectorAll(`.${block}__slide`);

    const offsetAfter = () => {
        if (!desktop.matches) return 0;
        const slideWidth = slides[0].offsetWidth;
        return Math.min(el.clientWidth - slideWidth, (slides.length - 1) * (slideWidth + desktopGap));
    };

    const swiper = new Swiper(el, {
        slidesPerView: 'auto',
        spaceBetween: gap,
        speed: 500,
        slidesOffsetAfter: offsetAfter(),
        breakpoints: {
            798: {
                spaceBetween: desktopGap,
            },
        },
        pagination: {
            el: container.querySelector(`.${block}__pagination`),
            clickable: true,
        },
        navigation: {
            prevEl: container.querySelector(`.${block}__nav-button_prev`),
            nextEl: container.querySelector(`.${block}__nav-button_next`),
        },
        on: {
            beforeResize(s) {
                s.params.slidesOffsetAfter = offsetAfter();
            },
        },
    });

    swiper.on('click', (s) => {
        if (!desktop.matches || s.clickedIndex === undefined) return;
        s.slideTo(s.clickedIndex);
    });

    return swiper;
}

function levers() {
    const desktop = window.matchMedia('(min-width: 798px)');

    document.querySelectorAll('.js-levers').forEach(container => {
        const swiper = expandSlider(container, 'levers');
        const slides = container.querySelectorAll('.levers__slide');

        swiper.on('click', (s) => {
            const slide = s.clickedSlide;
            if (desktop.matches || !slide) return;
            slide.classList.add('flipped');
            slide.classList.toggle('active');
        });

        desktop.addEventListener('change', () => {
            slides.forEach(slide => slide.classList.remove('active', 'flipped'));
        });
    });
}

function analytics() {
    document.querySelectorAll('.js-analytics').forEach(container => expandSlider(container, 'analytics', 10));
}

function showcase() {
    document.querySelectorAll('.js-showcase').forEach(preview => {
        preview.addEventListener('click', () => {
            const player = document.createElement('video');
            player.src = preview.dataset.videoSrc;
            player.poster = preview.querySelector('img')?.currentSrc || '';
            player.controls = true;
            player.autoplay = true;
            player.playsInline = true;
            preview.replaceWith(player);
            player.play().catch(() => {});
        });
    });
}

function flip() {
    const touch = window.matchMedia('(hover: none)');

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.js-flip');
        if (!card || !touch.matches) return;
        card.classList.toggle('active');
    });
}

function aos() {
    if (typeof AOS === 'undefined') return;

    AOS.init({
        once: true,
        offset: 40,
    });

    window.addEventListener('load', () => AOS.refresh());
}

function inits() {
    tel();
    header();
    notify();
    sliders();
    showcase();
    flip();
    aos();
}

window.addEventListener("DOMContentLoaded", inits);