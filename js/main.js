/* JTB × SPACE BUSINESS. No framework or external runtime dependency. */
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value));
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const narrowScreen = window.matchMedia("(max-width: 767px)");

  /** Native details の開閉状態にラベルを合わせる。 */
  function initializeDetails() {
    $$(".domain details").forEach((details) => {
      const syncLabel = () => {
        $(".details-label", details).textContent = details.open
          ? "CLOSE"
          : "VIEW MORE";
      };
      details.addEventListener("toggle", syncLabel);
      syncLabel();
    });
  }

  /** JS が使える時だけ、指定したセクションを画面内で表示する。 */
  function initializeReveals() {
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
      return;
    }
    revealTargets.forEach((element) => element.classList.add("is-visible"));
  }

  /** SIDE タブの選択状態とカード位置を一箇所で同期する。 */
  function initializeSideCarousel() {
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
      tabs.forEach((tab, tabIndex) => {
        const selected = tabIndex === currentSide;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        cards[tabIndex].classList.toggle("is-selected", selected);
        cards[tabIndex].setAttribute("aria-hidden", String(!selected));
        cards[tabIndex].inert = !selected;
        cards[tabIndex].tabIndex = selected ? 0 : -1;
        backgrounds[tabIndex].classList.toggle("is-selected", selected);
      });
      positionCards();
      if (focus) tabs[currentSide].focus();
    }

    $(".side-tabs").setAttribute("role", "tablist");
    tabs.forEach((tab, index) => {
      tab.parentElement.setAttribute("role", "presentation");
      tab.setAttribute("role", "tab");
      cards[index].setAttribute("role", "tabpanel");
      tab.addEventListener("click", () => selectSide(index));
      tab.addEventListener("keydown", (event) => {
        let target;
        if (event.key === "ArrowRight") target = index + 1;
        if (event.key === "ArrowLeft") target = index - 1;
        if (event.key === "Home") target = 0;
        if (event.key === "End") target = tabs.length - 1;
        if (target === undefined) return;
        event.preventDefault();
        selectSide(target, true);
      });
    });
    sides.classList.add("has-tabs");
    $(".side-prev").addEventListener("click", () => selectSide(currentSide - 1));
    $(".side-next").addEventListener("click", () => selectSide(currentSide + 1));
    selectSide(1);
    return { positionCards };
  }

  /** VISION と高度文を視覚用の一文字単位にし、読み上げ文は残す。 */
  function initializeCharacterReveals(scenes) {
    const visionCharacters = [];
    const paragraphs = [
      ...$$(".vision-paragraph"),
      ...$$(".altitude-message, .altitude-caption, .altitude-english"),
    ];
    paragraphs.forEach((paragraph) => {
      const sceneIndex = scenes.indexOf(paragraph.closest(".altitude-scene"));
      // 各高度シーンは、同じスクロール契機で同一の段階表示を始める。
      const characters = sceneIndex >= 0 ? [] : visionCharacters;
      if (paragraph.matches(".altitude-caption, .altitude-english")) {
        paragraph.textContent = paragraph.textContent.trim();
      }
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
        // コピー行間の整形空白は、表示する文字として数えない。
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
          if (sceneIndex >= 0) {
            span.style.setProperty("--character-index", characters.length);
          }
          characters.push(span);
          fragment.append(span);
        }
        node.replaceWith(fragment);
      });
    });
    return visionCharacters;
  }

  /** スクロール連動の高度・月面・VISION 表示を管理する。 */
  function initializeJourney(positionCards) {
    const lunarScope = $(".lunar-scope");
    const introLunarImage = $(".intro-lunar-image");
    const introScope = $(".intro-scope");
    const viewportStage = $(".lunar-backdrop-stage");
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
    const targets = scenes.map((scene) => Number(scene.dataset.altitude));
    const finalLabels = distances.map((distance) => distance.textContent);
    const cue = $(".scroll-cue");
    const vision = $(".vision");
    const visionStage = $(".vision-stage");
    const visionContent = $(".vision-content");
    const visionCharacters = initializeCharacterReveals(scenes);

    // スクロール距離と演出時間は高度値とは独立している。
    const HERO_DISTANCE = 0.65;
    const SCENE_DISTANCE = 1.05;
    const COUNT_DURATION = 680;
    const SCENE_ZOOM_LIMIT = 0.08;
    const SCENE_ZOOM_TIME = 16000;
    let displayedAltitude = 0;
    // 初回が静的表示でも、本文をすべて読める状態に初期化する。
    // animated は1画面ずつ切り替える配置の可否。動きの設定とは分ける。
    let animated = null;
    let motionReduced = null;
    let activeScene = -2;
    let animationFrame = 0;
    let countAnimation = null;
    let zoomAnimation = null;
    let zoomFrame = 0;
    let readCount = -1;
    let metrics = { height: 0, journeyTop: 0, visionTop: 0, visionTravel: 0 };
    let mobileBackdrop = null;
    let mobileBackgrounds = [];

    // 背景は旅路とVISIONで共有する。位置の固定はCSSのstickyに任せる。
    function syncMobileBackdrop() {
      const enabled = animated && narrowScreen.matches;
      if (enabled && !mobileBackdrop) {
        mobileBackdrop = document.createElement("div");
        mobileBackdrop.className = "mobile-journey-backdrop";
        mobileBackdrop.setAttribute("aria-hidden", "true");
        const sources = [
          $(".scene-image", hero),
          ...sceneImages.slice(0, -1),
          introLunarImage,
        ];
        mobileBackgrounds = sources.map((source, index) => {
          const image = source.cloneNode(false);
          image.className = "mobile-journey-image";
          image.dataset.scene = String(index - 1);
          image.removeAttribute("style");
          mobileBackdrop.append(image);
          return image;
        });
        introScope.prepend(mobileBackdrop);
      }
      introScope.classList.toggle("has-mobile-backdrop", enabled);
      if (!enabled) return;
      mobileBackgrounds.forEach((image, index) => {
        const selected = index === activeScene + 1;
        image.classList.toggle("is-current", selected);
        if (selected) {
          image.style.scale =
            activeScene >= 0
              ? sceneImages[activeScene].style.scale || "1"
              : "1";
        }
      });
      mobileBackdrop.style.setProperty(
        "--mobile-shade",
        activeScene < 0 ? $(".hero-shade").style.opacity || "0.85" : "0",
      );
    }

    // 月面ズームは、シーン切替・非表示・VISION 到達で必ず停止する。
    function pauseSceneZoom() {
      cancelAnimationFrame(zoomFrame);
      zoomFrame = 0;
      if (!zoomAnimation) return;
      zoomAnimation.lastFrame = null;
      zoomAnimation.image.classList.remove("is-zooming");
    }
    function updateSceneZoom(now) {
      zoomFrame = 0;
      if (!zoomAnimation || !animated || motionReduced || document.hidden) return;
      if (zoomAnimation.lastFrame !== null) {
        zoomAnimation.elapsed += now - zoomAnimation.lastFrame;
      }
      zoomAnimation.lastFrame = now;
      const zoom =
        1 +
        SCENE_ZOOM_LIMIT *
          -Math.expm1(-zoomAnimation.elapsed / SCENE_ZOOM_TIME);
      // scale は PC/SP ごとの既存 crop transform と合成される。
      zoomAnimation.image.style.scale = zoom.toFixed(6);
      if (introScope.classList.contains("has-mobile-backdrop")) {
        mobileBackgrounds[activeScene + 1].style.scale = zoom.toFixed(6);
      }
      if (zoomAnimation.image === sceneImages[scenes.length - 1]) {
        introLunarImage.style.scale = zoom.toFixed(6);
      }
      zoomFrame = requestAnimationFrame(updateSceneZoom);
    }
    function syncSceneZoom() {
      // VISION が入り始めたら共有する月面のズームを止める。
      const inJourney = window.scrollY + metrics.height <= metrics.visionTop;
      if (!zoomAnimation || motionReduced || !inJourney || document.hidden) {
        pauseSceneZoom();
        return;
      }
      if (!zoomFrame) {
        zoomAnimation.image.classList.add("is-zooming");
        zoomFrame = requestAnimationFrame(updateSceneZoom);
      }
    }
    // 演出を無効にした時は、すべてのコンテンツを通常フローへ戻す。
    function showAllContent() {
      document.body.classList.remove("is-in-altitude");
      [hero, ...scenes].forEach((scene) => {
        scene.classList.remove("is-current");
        scene.removeAttribute("aria-hidden");
        scene.inert = false;
      });
      distances.forEach((element, index) => {
        element.textContent = finalLabels[index];
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
    // シーン選択時に、見た目・操作対象・高度表示をまとめて切り替える。
    function setScene(index, now) {
      const previous = activeScene;
      activeScene = index;
      pauseSceneZoom();
      zoomAnimation =
        index >= 0 && !motionReduced
          ? { image: sceneImages[index], elapsed: 0, lastFrame: null }
          : null;
      // 入場する画像だけを戻し、退場する画像は crop を保って消す。
      if (zoomAnimation) zoomAnimation.image.style.scale = "1";
      if (index === scenes.length - 1) introLunarImage.style.scale = "1";
      journey.classList.toggle("is-ground", index === 0);
      lunarScope.classList.toggle("is-travelling", index >= 0);
      lunarScope.classList.toggle("is-at-moon", index === scenes.length - 1);
      hero.classList.toggle("is-current", index < 0);
      hero.setAttribute("aria-hidden", String(index >= 0));
      hero.inert = index >= 0;
      scenes.forEach((scene, sceneIndex) => {
        const current = sceneIndex === index;
        scene.classList.toggle("is-current", current);
        scene.setAttribute("aria-hidden", String(!current));
        scene.inert = !current;
      });
      journey.classList.toggle("is-travelling", index >= 0);
      readout.setAttribute("aria-hidden", String(index < 0));
      altitudeLinks.forEach((link, linkIndex) => {
        if (linkIndex === index) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
      if (index >= 0) {
        $(".altitude-marker").style.setProperty(
          "--marker-y",
          `${altitudeLinks[index].offsetTop}px`,
        );
        // 途中再読み込み時は、旅を再生せず現在高度をそのまま表示する。
        const from = previous >= 0 ? displayedAltitude : targets[index];
        readoutAccessible.textContent = `${finalLabels[index]}km`;
        if (motionReduced) {
          displayedAltitude = targets[index];
          readoutDistance.textContent = finalLabels[index];
          countAnimation = null;
        } else {
          countAnimation = { index, from, to: targets[index], start: now };
        }
      } else {
        countAnimation = null;
      }
      cue.setAttribute(
        "href",
        index >= scenes.length - 1
          ? "#vision"
          : `#altitude-${scenes[Math.max(0, index + 1)].id.replace("altitude-", "")}`,
      );
    }
    // スクロール中の更新は、1 フレームに1回だけ実行する。
    function requestUpdate() {
      if (!animationFrame) animationFrame = requestAnimationFrame(update);
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
      document.body.classList.toggle(
        "is-in-altitude",
        narrowScreen.matches && index >= 0 && window.scrollY < metrics.visionTop,
      );
      syncSceneZoom();
      const startShade = 0.85;
      $(".hero-shade").style.opacity = String(
        motionReduced
          ? startShade
          : startShade - clamp(travel / HERO_DISTANCE) * (startShade - 0.2),
      );
      syncMobileBackdrop();
      if (countAnimation) {
        const t = clamp((now - countAnimation.start) / COUNT_DURATION);
        const eased = 1 - (1 - t) ** 3;
        const count = Math.round(
          countAnimation.from +
            (countAnimation.to - countAnimation.from) * eased,
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
      const nextCount = motionReduced
        ? visionCharacters.length
        : Math.round(progress * visionCharacters.length);
      if (nextCount !== readCount) {
        visionCharacters.forEach((character, index) =>
          character.classList.toggle("is-read", index < nextCount),
        );
        readCount = nextCount;
      }
      if (countAnimation) requestUpdate();
    }
    // 画面サイズに応じて、固定演出の可否とスクロール基準を再計測する。
    function measure() {
      positionCards();
      // CSS と同じ安定した画面高を使い、スマホのバー伸縮で演出を切り替えない。
      const viewportHeight = viewportStage.getBoundingClientRect().height;
      const fixedHeight = $(".fixed-page-navigation").getBoundingClientRect()
        .bottom;
      const regularHeight = narrowScreen.matches ? 650 : fixedHeight + 550;
      // 通常のノートPCではコンパクト配置を使う。極端に低い画面だけ通常フローへ。
      const minimumHeight = narrowScreen.matches ? 480 : fixedHeight + 320;
      const nextAnimated = viewportHeight >= minimumHeight;
      const nextReduced = reducedMotion.matches;
      journey.classList.toggle(
        "is-compact",
        nextAnimated && viewportHeight < regularHeight,
      );
      if (animated !== nextAnimated || motionReduced !== nextReduced) {
        animated = nextAnimated;
        motionReduced = nextReduced;
        lunarScope.classList.toggle("has-animated-journey", animated);
        lunarScope.classList.toggle("is-reduced-motion", motionReduced);
        journey.classList.toggle("is-animated", animated);
        vision.classList.toggle("is-animated", animated && !motionReduced);
        showAllContent();
      }
      if (!animated || motionReduced) {
        visionStage.style.top = "";
        vision.style.removeProperty("--vision-height");
      }
      if (animated) {
        const height = stage.getBoundingClientRect().height;
        if (!motionReduced) {
          const visionHeight = Math.max(
            height,
            visionContent.getBoundingClientRect().height,
          );
          vision.style.setProperty(
            "--vision-height",
            `${Math.ceil(visionHeight)}px`,
          );
          visionStage.style.top = `${Math.min(0, height - visionHeight)}px`;
        }
        metrics = {
          height,
          journeyTop: journey.getBoundingClientRect().top + window.scrollY,
          visionTop: vision.getBoundingClientRect().top + window.scrollY,
          visionTravel: Math.max(1, vision.offsetHeight - height),
        };
      }
      // 診断URLで表示する値。通常のページには診断UIを出さない。
      journey.dataset.displayMode = !animated
        ? "static-height"
        : motionReduced
          ? "reduced-motion"
          : "animated";
      journey.dataset.viewportHeight = String(Math.round(viewportHeight));
      journey.dataset.minimumHeight = String(Math.ceil(minimumHeight));
      syncMobileBackdrop();
      requestUpdate();
    }
    // ハッシュ遷移では、固定ナビと高度シーン専用の位置補正を適用する。
    function navigate(hash, smooth = true) {
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      let top = target.getBoundingClientRect().top + window.scrollY;
      const index = scenes.indexOf(target);
      if (animated && index >= 0) {
        top =
          metrics.journeyTop +
          (HERO_DISTANCE + index * SCENE_DISTANCE + 0.25) * metrics.height;
      }
      if (index < 0 && hash !== "#top" && hash !== "#vision") {
        const heading = target.querySelector(".section-heading");
        if (heading) {
          top = heading.getBoundingClientRect().top + window.scrollY;
        }
        const fixedBottom = $(".fixed-page-navigation").getBoundingClientRect()
          .bottom;
        top -= fixedBottom + 24;
      }
      if (hash === "#top") top = 0;
      window.scrollTo({
        top,
        behavior: smooth && !reducedMotion.matches ? "smooth" : "instant",
      });
      // 通常セクションだけ、二重スクロールなしで焦点を移す。
      if (index < 0 && hash !== "#top") {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
      }
    }
    function initializeNavigation() {
      $$("a[href^=\"#\"]").forEach((link) => {
        link.addEventListener("click", (event) => {
          const hash = link.getAttribute("href");
          if (!document.getElementById(hash.slice(1))) return;
          event.preventDefault();
          // file:// で ZIP を直接開く場合、History API は使えないことがある。
          try {
            history.pushState(null, "", hash);
          } catch {
            /* Navigation still works. */
          }
          navigate(hash);
        });
      });
      window.addEventListener("popstate", () => {
        navigate(location.hash || "#top", false);
      });
    }
    function initializeLayoutObservers() {
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
    }

    initializeNavigation();
    initializeLayoutObservers();
  }

  // 初期化順は DOM への初回反映とイベント順を従来どおりに保つ。
  initializeDetails();
  initializeReveals();
  const { positionCards } = initializeSideCarousel();
  initializeJourney(positionCards);
})();
