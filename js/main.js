/* JTB × SPACE BUSINESS. No framework or external runtime dependency. */
(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const clamp = (value, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const narrowScreen = window.matchMedia("(max-width: 767px)");

  // Native details still opens and closes with JavaScript disabled.
  $$(".domain details").forEach((details) => {
    const sync = () => {
      $(".details-label", details).textContent = details.open
        ? "CLOSE"
        : "VIEW MORE";
    };
    details.addEventListener("toggle", sync);
    sync();
  });

  // Content remains visible without JavaScript. Once motion is available,
  // reveal only the requested sections as they enter the viewport.
  const revealGroups = [
    [
      ".earth-space h2",
      ".earth-space .side-tabs",
      ".earth-space .side-carousel",
    ],
    [".domain .section-heading", ...$$(".domain-item")],
    [".news .section-heading", ...$$(".news-row")],
  ];
  const revealTargets = [];
  revealGroups.forEach((group) => {
    group.forEach((item, index) => {
      const element = typeof item === "string" ? $(item) : item;
      if (!element) return;
      element.classList.add("reveal-target");
      element.style.setProperty(
        "--reveal-delay",
        `${Math.min(index, 5) * 80}ms`,
      );
      revealTargets.push(element);
    });
  });
  if ("IntersectionObserver" in window && !reducedMotion.matches) {
    document.documentElement.classList.add("has-reveal-motion");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8%" },
    );
    revealTargets.forEach((element) => revealObserver.observe(element));
  } else {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
  }

  const sides = $(".earth-space");
  const tabs = $$(".side-tab");
  const cards = $$(".side-card");
  const backgrounds = $$(".side-background");
  const track = $(".side-track");
  let currentSide = 1;
  function positionCards() {
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const width = cards[0].getBoundingClientRect().width;
    track.style.setProperty(
      "--track-offset",
      `${-currentSide * (width + gap)}px`,
    );
  }
  function selectSide(index, focus = false) {
    currentSide = (index + tabs.length) % tabs.length;
    tabs.forEach((tab, i) => {
      const selected = i === currentSide;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      cards[i].classList.toggle("is-selected", selected);
      cards[i].setAttribute("aria-hidden", String(!selected));
      cards[i].inert = !selected;
      cards[i].tabIndex = selected ? 0 : -1;
      backgrounds[i].classList.toggle("is-selected", selected);
    });
    positionCards();
    if (focus) tabs[currentSide].focus();
  }
  $(".side-tabs").setAttribute("role", "tablist");
  tabs.forEach((tab, i) => {
    tab.parentElement.setAttribute("role", "presentation");
    tab.setAttribute("role", "tab");
    cards[i].setAttribute("role", "tabpanel");
    tab.addEventListener("click", () => selectSide(i));
    tab.addEventListener("keydown", (event) => {
      let target;
      if (event.key === "ArrowRight") target = i + 1;
      if (event.key === "ArrowLeft") target = i - 1;
      if (event.key === "Home") target = 0;
      if (event.key === "End") target = tabs.length - 1;
      if (target !== undefined) {
        event.preventDefault();
        selectSide(target, true);
      }
    });
  });
  sides.classList.add("has-tabs");
  $(".side-next").addEventListener("click", () => selectSide(currentSide + 1));
  selectSide(1);

  const lunarScope = $(".lunar-scope");
  const introLunarImage = $(".intro-lunar-image");
  const journey = $(".journey");
  const stage = $(".journey-stage");
  const hero = $(".hero");
  const scenes = $$(".altitude-scene");
  const sceneImages = scenes.map(
    (scene) => $(".scene-image", scene) || $(".lunar-background"),
  );
  const altitudeLinks = $$("[data-altitude-link]");
  const distances = $$(".altitude-scene .distance");
  const readout = $(".altitude-readout");
  const readoutDistance = $(".distance", readout);
  const readoutAccessible = $(".sr-only", readout);
  let displayedAltitude = 0;
  const targets = scenes.map((scene) => Number(scene.dataset.altitude));
  const finalLabels = distances.map((distance) => distance.textContent);
  const cue = $(".scroll-cue");
  const vision = $(".vision");
  const visionStage = $(".vision-stage");
  const visionContent = $(".vision-content");
  const visionCharacters = [];

  // Preserve complete paragraphs for assistive technology; only the visual text
  // is split into characters. Explicit line breaks keep the PC/SP composition.
  [
    ...$$(".vision-paragraph"),
    ...$$(".altitude-message, .altitude-caption, .altitude-english"),
  ].forEach((paragraph) => {
    const sceneIndex = scenes.indexOf(paragraph.closest(".altitude-scene"));
    // Each scene text starts its own identical stagger on the same scroll trigger.
    const characters = sceneIndex >= 0 ? [] : visionCharacters;
    if (paragraph.matches(".altitude-caption, .altitude-english"))
      paragraph.textContent = paragraph.textContent.trim();
    const spoken = paragraph.textContent;
    const visual = document.createElement("span");
    visual.setAttribute("aria-hidden", "true");
    while (paragraph.firstChild) visual.append(paragraph.firstChild);
    const accessible = document.createElement("span");
    accessible.className = "sr-only";
    accessible.textContent = spoken;
    paragraph.append(accessible, visual);
    const walker = document.createTreeWalker(visual, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    textNodes.forEach((node) => {
      // Formatting whitespace between copy lines is not a revealable character.
      if (sceneIndex >= 0 && !node.textContent.trim()) {
        node.remove();
        return;
      }
      const fragment = document.createDocumentFragment();
      for (const character of node.textContent) {
        const span = document.createElement("span");
        span.className =
          sceneIndex >= 0 ? "message-character" : "vision-character";
        span.textContent = character;
        if (sceneIndex >= 0)
          span.style.setProperty("--character-index", characters.length);
        characters.push(span);
        fragment.append(span);
      }
      node.replaceWith(fragment);
    });
  });

  // Scroll distances are independent of altitude magnitude. Adjust only here.
  const HERO_DISTANCE = 0.65;
  const SCENE_DISTANCE = 1.05;
  const COUNT_DURATION = 680;
  // A gentle time-based zoom approaches this limit without a visible stop/reset.
  const SCENE_ZOOM_LIMIT = 0.08;
  const SCENE_ZOOM_TIME = 16000;
  let animated = false;
  let activeScene = -2;
  let animationFrame = 0;
  let countAnimation = null;
  let zoomAnimation = null;
  let zoomFrame = 0;
  let readCount = -1;
  let metrics = { height: 0, journeyTop: 0, visionTop: 0, visionTravel: 0 };

  function pauseSceneZoom() {
    cancelAnimationFrame(zoomFrame);
    zoomFrame = 0;
    if (!zoomAnimation) return;
    zoomAnimation.lastFrame = null;
    zoomAnimation.image.classList.remove("is-zooming");
  }

  function updateSceneZoom(now) {
    zoomFrame = 0;
    if (!zoomAnimation || !animated || document.hidden) return;
    if (zoomAnimation.lastFrame !== null)
      zoomAnimation.elapsed += now - zoomAnimation.lastFrame;
    zoomAnimation.lastFrame = now;
    const zoom =
      1 +
      SCENE_ZOOM_LIMIT * -Math.expm1(-zoomAnimation.elapsed / SCENE_ZOOM_TIME);
    // Individual scale composes with the existing PC/SP image crop transforms.
    zoomAnimation.image.style.scale = zoom.toFixed(6);
    if (zoomAnimation.image === sceneImages[scenes.length - 1])
      introLunarImage.style.scale = zoom.toFixed(6);
    zoomFrame = requestAnimationFrame(updateSceneZoom);
  }

  function syncSceneZoom() {
    // Freeze the shared moon as VISION starts entering the viewport.
    const inJourney = window.scrollY + metrics.height <= metrics.visionTop;
    if (!zoomAnimation || !inJourney || document.hidden) {
      pauseSceneZoom();
      return;
    }
    if (!zoomFrame) {
      zoomAnimation.image.classList.add("is-zooming");
      zoomFrame = requestAnimationFrame(updateSceneZoom);
    }
  }

  function showAllContent() {
    [hero, ...scenes].forEach((scene) => {
      scene.classList.remove("is-current");
      scene.removeAttribute("aria-hidden");
      scene.inert = false;
    });
    distances.forEach((el, i) => {
      el.textContent = finalLabels[i];
    });
    pauseSceneZoom();
    zoomAnimation = null;
    sceneImages.forEach((image) => image.style.removeProperty("scale"));
    introLunarImage.style.removeProperty("scale");
    visionCharacters.forEach((character) => character.classList.add("is-read"));
    readout.setAttribute("aria-hidden", "true");
    activeScene = -2;
    countAnimation = null;
    readCount = -1;
  }

  function measure() {
    positionCards();
    // Short landscape screens use the readable flow layout, without pinning.
    const fixedHeight = document
      .querySelector(".fixed-page-navigation")
      .getBoundingClientRect().bottom;
    const minimumHeight = narrowScreen.matches ? 650 : fixedHeight + 550;
    const nextAnimated =
      !reducedMotion.matches && window.innerHeight >= minimumHeight;
    if (animated !== nextAnimated) {
      animated = nextAnimated;
      lunarScope.classList.toggle("has-animated-journey", animated);
      journey.classList.toggle("is-animated", animated);
      vision.classList.toggle("is-animated", animated);
      showAllContent();
    }
    if (animated) {
      const height = stage.getBoundingClientRect().height;
      const visionHeight = Math.max(
        height,
        visionContent.getBoundingClientRect().height,
      );
      vision.style.setProperty(
        "--vision-height",
        `${Math.ceil(visionHeight)}px`,
      );
      visionStage.style.top = `${Math.min(0, height - visionHeight)}px`;
      metrics = {
        height,
        journeyTop: journey.getBoundingClientRect().top + window.scrollY,
        visionTop: vision.getBoundingClientRect().top + window.scrollY,
        visionTravel: Math.max(1, vision.offsetHeight - height),
      };
    } else {
      visionStage.style.top = "";
      vision.style.removeProperty("--vision-height");
    }
    requestUpdate();
  }

  function setScene(index, now) {
    const previous = activeScene;
    activeScene = index;
    pauseSceneZoom();
    zoomAnimation =
      index >= 0
        ? { image: sceneImages[index], elapsed: 0, lastFrame: null }
        : null;
    // Reset only the incoming image; the outgoing image keeps its crop while fading.
    if (zoomAnimation) zoomAnimation.image.style.scale = "1";
    if (index === scenes.length - 1) introLunarImage.style.scale = "1";
    journey.classList.toggle("is-ground", index === 0);
    lunarScope.classList.toggle("is-travelling", index >= 0);
    lunarScope.classList.toggle("is-at-moon", index === scenes.length - 1);
    hero.classList.toggle("is-current", index < 0);
    hero.setAttribute("aria-hidden", String(index >= 0));
    hero.inert = index >= 0;
    scenes.forEach((scene, i) => {
      const current = i === index;
      scene.classList.toggle("is-current", current);
      scene.setAttribute("aria-hidden", String(!current));
      scene.inert = !current;
    });
    journey.classList.toggle("is-travelling", index >= 0);
    readout.setAttribute("aria-hidden", String(index < 0));
    altitudeLinks.forEach((link, i) => {
      if (i === index) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    if (index >= 0) {
      $(".altitude-marker").style.setProperty(
        "--marker-y",
        `${altitudeLinks[index].offsetTop}px`,
      );
      // Re-loading midway shows the exact altitude without replaying a journey.
      const from = previous >= 0 ? displayedAltitude : targets[index];
      readoutAccessible.textContent = `${finalLabels[index]}km`;
      countAnimation = { index, from, to: targets[index], start: now };
    } else countAnimation = null;
    cue.setAttribute(
      "href",
      index >= scenes.length - 1
        ? "#vision"
        : `#altitude-${scenes[Math.max(0, index + 1)].id.replace("altitude-", "")}`,
    );
  }

  function update(now) {
    animationFrame = 0;
    if (!animated) return;
    const travel = (window.scrollY - metrics.journeyTop) / metrics.height;
    const index =
      travel < HERO_DISTANCE
        ? -1
        : clamp(
            Math.floor((travel - HERO_DISTANCE) / SCENE_DISTANCE),
            0,
            scenes.length - 1,
          );
    if (index !== activeScene) setScene(index, now);
    syncSceneZoom();
    const startShade = 0.85;
    $(".hero-shade").style.opacity = String(
      startShade - clamp(travel / HERO_DISTANCE) * (startShade - 0.2),
    );
    if (countAnimation) {
      const t = clamp((now - countAnimation.start) / COUNT_DURATION);
      const eased = 1 - (1 - t) ** 3;
      const count = Math.round(
        countAnimation.from + (countAnimation.to - countAnimation.from) * eased,
      );
      displayedAltitude = count;
      readoutDistance.textContent =
        t === 1
          ? finalLabels[countAnimation.index]
          : count >= 10000
            ? `${(count / 10000).toFixed(1).replace(/\.0$/, "")}万`
            : String(count).padStart(2, "0");
      if (t === 1) countAnimation = null;
    }
    const progress = clamp(
      (window.scrollY - metrics.visionTop + metrics.height * 0.08) /
        (metrics.visionTravel * 0.86),
    );
    const nextCount = Math.round(progress * visionCharacters.length);
    if (nextCount !== readCount) {
      visionCharacters.forEach((character, i) =>
        character.classList.toggle("is-read", i < nextCount),
      );
      readCount = nextCount;
    }
    if (countAnimation) requestUpdate();
  }
  function requestUpdate() {
    if (!animationFrame) animationFrame = requestAnimationFrame(update);
  }
  function navigate(hash, smooth = true) {
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    let top = target.getBoundingClientRect().top + window.scrollY;
    const index = scenes.indexOf(target);
    if (animated && index >= 0)
      top =
        metrics.journeyTop +
        (HERO_DISTANCE + index * SCENE_DISTANCE + 0.25) * metrics.height;
    if (index < 0 && hash !== "#top" && hash !== "#vision") {
      const heading = target.querySelector(".section-heading");
      if (heading) top = heading.getBoundingClientRect().top + window.scrollY;
      const fixedBottom = $(".fixed-page-navigation").getBoundingClientRect()
        .bottom;
      top -= fixedBottom + 24;
    }
    if (hash === "#top") top = 0;
    window.scrollTo({
      top,
      behavior: smooth && !reducedMotion.matches ? "smooth" : "instant",
    });
    // Move keyboard focus to regular page sections, without a second scroll.
    if (index < 0 && hash !== "#top") {
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
  }
  $$('a[href^="#"]').forEach((link) =>
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      if (!document.getElementById(hash.slice(1))) return;
      event.preventDefault();
      // History API is optional for a file:// delivery opened directly from a ZIP.
      try {
        history.pushState(null, "", hash);
      } catch {
        /* Navigation still works. */
      }
      navigate(hash);
    }),
  );
  window.addEventListener("popstate", () =>
    navigate(location.hash || "#top", false),
  );
  window.addEventListener("scroll", requestUpdate, { passive: true });
  document.addEventListener("visibilitychange", () => {
    pauseSceneZoom();
    requestUpdate();
  });
  window.addEventListener("resize", measure, { passive: true });
  reducedMotion.addEventListener("change", measure);
  const layoutObserver = new ResizeObserver(measure);
  layoutObserver.observe(stage);
  layoutObserver.observe(visionContent);
  measure();
  document.fonts.ready.then(() => {
    measure();
    if (location.hash) navigate(location.hash, false);
  });
})();
