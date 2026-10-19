window.onload = function () {
  // Wait for webfont
  waitForWebfonts(["Playfair Display"], () => {
    // For each list item
    $("ul li a").each((i, e) => {
      // Initialize a new LiquidText instance
      let liquidText = new LiquidText(
        e, // Element
        0.05, // Liquid Volatility
        1 // Speed
      ).start();
    });
  });
};

// Global instances (we only want one instance of these, for performance)
let globalMaterial = new Blotter.LiquidDistortMaterial();

let globalBlotter = new Blotter(globalMaterial, {
  texts: [],
  autostart: false,
  autobuild: false
});

class LiquidText {
  constructor(element, volatility, speed) {
    this.element = element;
    this.text = element.text;
    this.fontSize = parseInt($(element).css("font-size"));
    this.fontStack = $(element).css("font-family");
    this.fontWeight = $(element).css("font-weight");
    this.fontColor = $(element).css("color");
    this.material = globalMaterial;
    this.hoverDuration = 0.25;
    this.hoverEase = Linear.easeIn;
    this.liquidVolatility = volatility ? volatility : 0.025;
    this.liquidSpeed = speed ? speed : 1;
    this.scope = null;
    this.blotter = globalBlotter;
    this.blotterText = null;
    this.onResize = this.onResize.bind(this);

    window.addEventListener("resize", this.onResize);

    this.initialize();
  }
  initialize() {
    let blotter = this.blotter;
    let text = new Blotter.Text(this.text, {
      family: this.fontStack,
      size: this.fontSize,
      fill: this.fontColor,
      weight: this.fontWeight,
      paddingLeft: 0,
      paddingRight: 250
    });
    text.needsUpdate = true;
    this.blotterText = text;
    this.material.uniforms.uVolatility.value = 0;
    this.material.uniforms.uSeed.value = 0.1;
    blotter.addText(text);

    blotter.needsUpdate = true;

    var scope = blotter.forText(text);

    this.scope = scope;

    scope.appendTo(this.element);

    this.element.onmouseenter = (event) => {
      this.scope.material.needsUpdate = true;
      gsap.fromTo(
        this.scope.material.uniforms.uVolatility,
        this.hoverDuration,
        {
          value: 0,
          ease: this.hoverEase
        },
        {
          value: this.liquidVolatility,
          ease: this.hoverEase
        }
      );
    };

    this.element.onmouseleave = (event) => {
      gsap.fromTo(
        this.scope.material.uniforms.uVolatility,
        this.hoverDuration,
        {
          value: this.scope.material.uniforms.uVolatility.value,
          ease: this.hoverEase
        },
        {
          value: 0,
          ease: this.hoverEase,
          onComplete: () => {
            this.scope.material.needsUpdate = true;
          }
        }
      );
    };
  }
  stop() {
    this.blotter.stop();
  }
  start() {
    this.blotter.start();
  }
  onResize() {
    let text = this.blotterText;
    let time = 100;
    let timer;
    if (timer) clearTimeout(timer);
    timer = setTimeout(
      () => {
        text.properties.size = parseInt($(this.element).css("font-size"));
        text.needsUpdate = true;
      },
      time,
      event
    );
  }
}

function waitForWebfonts(fonts, callback) {
  var loadedFonts = 0;
  for (var i = 0, l = fonts.length; i < l; ++i) {
    (function (font) {
      var node = document.createElement("span");
      // Characters that vary significantly among different fonts
      node.innerHTML = "giItT1WQy@!-/#";
      // Visible - so we can measure it - but not on the screen
      node.style.position = "absolute";
      node.style.left = "-10000px";
      node.style.top = "-10000px";
      // Large font size makes even subtle changes obvious
      node.style.fontSize = "300px";
      // Reset any font properties
      node.style.fontFamily = "sans-serif";
      node.style.fontVariant = "normal";
      node.style.fontStyle = "normal";
      node.style.fontWeight = "normal";
      node.style.letterSpacing = "0";
      document.body.appendChild(node);

      // Remember width with no applied web font
      var width = node.offsetWidth;

      node.style.fontFamily = font + ", sans-serif";

      var interval;

      function checkFont() {
        // Compare current width with original width
        if (node && node.offsetWidth != width) {
          ++loadedFonts;
          node.parentNode.removeChild(node);
          node = null;
        }

        // If all fonts have been loaded
        if (loadedFonts >= fonts.length) {
          if (interval) {
            clearInterval(interval);
          }
          if (loadedFonts == fonts.length) {
            callback();
            return true;
          }
        }
      }

      if (!checkFont()) {
        interval = setInterval(checkFont, 50);
      }
    })(fonts[i]);
  }
}
