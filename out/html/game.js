(function() {
  var game;
  var ui;

  var DateOptions = {hour: 'numeric',
                 minute: 'numeric',
                 second: 'numeric',
                 year: 'numeric',
                 month: 'short',
                 day: 'numeric' };

  var main = function(dendryUI) {
    ui = dendryUI;
    game = ui.game;

    // -------------------------------------------------------------------------
    // PATCH: Replace the mutually-recursive _mergeStateEvals /
    // _mergeStateEvalsInArray pair with a stack-based iterative version.
    //
    // The originals call each other until the content tree is fully resolved.
    // Deep sidebar scenes (hundreds of conditionals/nested paragraph nodes)
    // blow past JS call stack limit => RangeError in core.js:716.
    //
    // We cannot edit core.js, but overwriting prototype methods here works
    // because core.js is fully parsed before main() is ever called, and the
    // live engine instance gives us the right prototype object to patch.
    // -------------------------------------------------------------------------
    var engineProto = Object.getPrototypeOf(dendryUI.dendryEngine);

    engineProto._mergeStateEvalsInArray = function(array, evals) {
        if (!Array.isArray(array)) { array = [array]; }

        // Each stack frame: { items, index, target }
        // target = the output array we push resolved nodes into.
        var output = [];
        var stack = [{ items: array, index: 0, target: output }];

        while (stack.length > 0) {
            var frame = stack[stack.length - 1];

            if (frame.index >= frame.items.length) {
                stack.pop();
                continue;
            }

            var content = frame.items[frame.index];
            frame.index++;

            // Raw / already-resolved node: pass through.
            if (content.type === undefined) {
                frame.target.push(content);
                continue;
            }

            switch (content.type) {
            case 'conditional':
                if (evals[content.predicate]) {
                    // Conditionals are transparent: resolve children into the
                    // SAME target so the wrapper itself disappears.
                    var condItems = Array.isArray(content.content)
                        ? content.content : [content.content];
                    stack.push({ items: condItems, index: 0, target: frame.target });
                }
                // false conditional: emit nothing.
                break;

            case 'insert':
                var insertVal = evals[content.insert];
                if (Array.isArray(insertVal)) {
                    for (var j = 0; j < insertVal.length; j++) {
                        frame.target.push(insertVal[j]);
                    }
                } else if (insertVal !== undefined && insertVal !== null) {
                    frame.target.push(insertVal);
                }
                break;

            default:
                // Structural node (paragraph, emphasis, etc.): keep it but
                // resolve its children into a fresh newContent array.
                // Push the node NOW to preserve ordering in the parent target,
                // then push a child frame to populate newContent.
                var newE = { type: content.type };
                var newContent = [];
                newE.content = newContent;
                frame.target.push(newE);

                var childItems = Array.isArray(content.content)
                    ? content.content : [content.content];
                stack.push({ items: childItems, index: 0, target: newContent });
                break;
            }
        }

        return output;
    };

    // Single-node entry point: just delegate to the array version.
    engineProto._mergeStateEvals = function(content, evals) {
        return this._mergeStateEvalsInArray([content], evals);
    };
    // -------------------------------------------------------------------------

    // Add your custom code here.
  };

  var TITLE = "Social Democracy: An Alternate History" + '_' + "Autumn Chen";

  // the url is a link to game.json
  // test url: https://aucchen.github.io/social_democracy_mods/v0.1.json
  window.loadMod = function(url) {
      ui.loadGame(url);
  };

  window.showStats = function() {
    if (window.dendryUI.dendryEngine.state.sceneId.startsWith('library')) {
        window.dendryUI.dendryEngine.goToScene('backSpecialScene');
    } else {
        window.dendryUI.dendryEngine.goToScene('library');
    }
  };

  window.showSandbox = function() {
    if (window.dendryUI.dendryEngine.state.sceneId.startsWith('sandbox')) {
        window.dendryUI.dendryEngine.goToScene('backSpecialScene');
    } else {
        window.dendryUI.dendryEngine.goToScene('sandbox');
    }
  };

  window.showStates = function() {
    if (window.dendryUI.dendryEngine.state.sceneId.startsWith('state_affairs')) {
        window.dendryUI.dendryEngine.goToScene('backSpecialScene');
    } else {
        window.dendryUI.dendryEngine.goToScene('state_affairs');
    }
  };

  window.showDDPfrac = function() {
    if (window.dendryUI.dendryEngine.state.sceneId.startsWith('ddp_faction_parliament')) {
        window.dendryUI.dendryEngine.goToScene('backSpecialScene');
    } else {
        window.dendryUI.dendryEngine.goToScene('ddp_faction_parliament');
    }
  };
  
  window.showMods = function() {
    window.hideOptions();
    if (window.dendryUI.dendryEngine.state.sceneId.startsWith('mod_loader')) {
        window.dendryUI.dendryEngine.goToScene('backSpecialScene');
    } else {
        window.dendryUI.dendryEngine.goToScene('mod_loader');
    }
  };
  
  window.showOptions = function() {
      var save_element = document.getElementById('options');
      window.populateOptions();
      save_element.style.display = "block";
      if (!save_element.onclick) {
          save_element.onclick = function(evt) {
              var target = evt.target;
              var save_element = document.getElementById('options');
              if (target == save_element) {
                  window.hideOptions();
              }
          };
      }
  };

  window.hideOptions = function() {
      var save_element = document.getElementById('options');
      save_element.style.display = "none";
  };

  window.disableBg = function() {
      window.dendryUI.disable_bg = true;
      document.body.style.backgroundImage = 'none';
      window.dendryUI.saveSettings();
  };

  window.enableBg = function() {
      window.dendryUI.disable_bg = false;
      window.dendryUI.setBg(window.dendryUI.dendryEngine.state.bg);
      window.dendryUI.saveSettings();
  };

  window.disableAnimate = function() {
      window.dendryUI.animate = false;
      window.dendryUI.saveSettings();
  };

  window.enableAnimate = function() {
      window.dendryUI.animate = true;
      window.dendryUI.saveSettings();
  };

  window.disableAnimateBg = function() {
      window.dendryUI.animate_bg = false;
      window.dendryUI.saveSettings();
  };

  window.enableAnimateBg = function() {
      window.dendryUI.animate_bg = true;
      window.dendryUI.saveSettings();
  };

  window.disableAudio = function() {
      window.dendryUI.toggle_audio(false);
      window.dendryUI.saveSettings();
  };

  window.enableAudio = function() {
      window.dendryUI.toggle_audio(true);
      window.dendryUI.saveSettings();
  };

  window.enableImages = function() {
    window.dendryUI.show_portraits = true;
    window.dendryUI.saveSettings();
   };

  window.disableImages = function() {
    window.dendryUI.show_portraits = false;
    window.dendryUI.saveSettings();
};

window.enableLightMode = function() {
    window.dendryUI.dark_mode = false;
    document.body.classList.remove('dark-mode');
    window.dendryUI.saveSettings();
};
window.enableDarkMode = function() {
    window.dendryUI.dark_mode = true;
    document.body.classList.add('dark-mode');
    window.dendryUI.saveSettings();
};

window.enableGrayMode = function() {
    window.dendryUI.gray_mode = true;
    document.body.classList.add('gray-mode');
    window.dendryUI.saveSettings();
};
window.disableGrayMode = function() {
    window.dendryUI.gray_mode = false;
    document.body.classList.remove('gray-mode');
    window.dendryUI.saveSettings();
};

  // populates the checkboxes in the options view
  window.populateOptions = function() {
    var disable_bg = window.dendryUI.disable_bg;
    var animate = window.dendryUI.animate;
    var disable_audio = window.dendryUI.disable_audio;
    var show_portraits = window.dendryUI.show_portraits;
    if (disable_bg) {
        $('#backgrounds_no')[0].checked = true;
    } else {
        $('#backgrounds_yes')[0].checked = true;
    }
    if (animate) {
        $('#animate_yes')[0].checked = true;
    } else {
        $('#animate_no')[0].checked = true;
    }
    if (disable_audio) {
        $('#audio_no')[0].checked = true;
    } else {
        $('#audio_yes')[0].checked = true;
    }
    if (show_portraits) {
        $('#images_yes')[0].checked = true;
    } else {
        $('#images_no')[0].checked = true;
    }
    if (window.dendryUI.dark_mode) {
        $('#dark_mode')[0].checked = true;
    } else {
        $('#light_mode')[0].checked = true;
    }
    if (window.dendryUI.gray_mode) {
        $('#gray_on')[0].checked = true;
    } else {
        $('#gray_no')[0].checked = true;
    }
  };

  
  // This function allows you to modify the text before it's displayed.
  // E.g. wrapping chat-like messages in spans.
  window.displayText = function(text) {
      return text;
  };

  // This function allows you to do something in response to signals.
  window.handleSignal = function(signal, event, scene_id) {
  };
  
  // This function runs on a new page. Right now, this auto-saves.
  window.onNewPage = function() {
    var scene = window.dendryUI.dendryEngine.state.sceneId;
    if (scene != 'root' && !window.justLoaded) {
        window.dendryUI.autosave();
    }
    if (window.justLoaded) {
        window.justLoaded = false;
    }
  };

  window.updateSidebar = function() {
    $('#qualities').empty();
    var scene = dendryUI.game.scenes[window.statusTab];
    document.getElementById('qualities').innerHTML = 'tab: ' + window.statusTab;
    if (!scene) return;
    dendryUI.dendryEngine._runActions(scene.onArrival);
    var displayContent = dendryUI.dendryEngine._makeDisplayContent(scene.content, true);
    $('#qualities').append(dendryUI.contentToHTML.convert(displayContent));
    colorTextNodes(document.getElementById('qualities'), colors);
};

    window.updateSidebarRight = function() {
        $('#qualities_right').empty();
        var scene = dendryUI.game.scenes[window.statusTabRight];
        dendryUI.dendryEngine._runActions(scene.onArrival);
        var displayContent = dendryUI.dendryEngine._makeDisplayContent(scene.content, true);
        $('#qualities_right').append(dendryUI.contentToHTML.convert(displayContent));
        colorTextNodes(document.getElementById('qualities_right'), colors);
};

  window.changeTab = function(newTab, tabId, isRight) {
      if (tabId == 'poll_tab' && (dendryUI.dendryEngine.state.qualities.historical_mode)) {
          if (dendryUI.dendryEngine.state.qualities.historical_mode) window.alert('Polls are not available in historical mode.');
          return;
      }
      var tabButton = document.getElementById(tabId);
      var tabButtons = document.getElementsByClassName('tab_button');
      for (i = 0; i < tabButtons.length; i++) {
        tabButtons[i].className = tabButtons[i].className.replace(' active', '');
      }
      tabButton.className += ' active';
      if (isRight) {
        window.statusTabRight = newTab;
        window.updateSidebarRight();
        } else {
          window.statusTab = newTab;
          window.updateSidebar();
    }
          window.statusTab = newTab;
          window.updateSidebar();
  };

 window.onDisplayContent = function() {
    window.updateSidebar();
    window.updateSidebarRight();

    // Pause the observer so colorTextNodes mutations don't fire it
    if (window._decoObserver) window._decoObserver.disconnect();

    colorTextNodes(document.getElementById('content'), colors);

    // Re-attach after coloring is done
    var contentEl = document.getElementById('content');
    if (contentEl && window._decoObserver) {
        window._decoObserver.observe(contentEl, { childList: true, subtree: true });
    }
};
var colors = {
        'kpd': '#700000',
        'spd': '#c90000',
        'ddp': '#D3C24D',
        'z': '#000000',
        'dvp': '#C0A054',
        'dnvp': '#3E88B3',
        'nsdap': '#7A3C00',
        'others': '#808080',
        'independents': '#808080',
        'wp': '#e9ebf0',
        'vnr': '#d3d3a9',
        'vrp': '#0076ea',
        'dbp': '#097100',
        'cnblp': '#7FCEB1',
        'csvd': '#67bed9',
        'kvp': '#0087DC',
        'aspd': '#000000',
        'sapd': '#9b0000',
        'lvp': '#ffcc00',
        'dnf': '#003755',
        'slp': '#ffe600',
        'kpo': '#c43988',
        'spo': '#c43988',
        'sed': '#5b0303',
        'srp': '#f0b9ca',
        'adgbpf': '#dd6400',
        'nsbp': '#ff9393',
        'msp': '#acacac',
        'sz': '#61e790',
        'nspd': '#ed5151',
        'llb': '#ffff50',
        'acvp': '#700147',
        'pcp': '#a85c00',
        'cvp': '#000000',
        'dstp': '#d3c24d',
        'dlp': '#d8c200',
        'vlp': '#b2a000',
        'KPD': '#700000',
        'SPD': '#C90000',
        'DDP': '#D3C24D',
        'Z': '#000000',
        'DVP': '#C0A054',
        'DNVP': '#3E88B3',
        'NSDAP': '#7A3C00',
        'OTHERS': '#808080',
        'INDEPENDENTS': '#808080',
        'WP': '#E9EBF0',
        'VNR': '#D3D3A9',
        'VRP': '#0076ea',
        'DBP': '#097100',
        'CNBLP': '#7FCEB1',
        'CSVD': '#67BED9',
        'KVP': '#0087DC',
        'ASPD': '#000000',
        'SAPD': '#9B0000',
        'LVP': '#FFCC00',
        'DNF': '#003755',
        'SLP': '#FFE600',
        'KPO': '#C43988',
        'SPO': '#C43988',
        'SED': '#5B0303',
        'SRP': '#F0B9CA',
        'ADGBPF': '#DD6400',
        'NSBP': '#FF9393',
        'MSP': '#ACACAC',
        'SZ': '#61E790',
        'NSPD': '#ED5151',
        'LLB': '#FFFF50',
        'ACVP': '#700147',
        'PCP': '#A85C00',
        'CVP': '#000000',
        'DStP': '#D3C24D',
        'DLP': '#D8C200',
        'VLP': '#B2A000'
    };
    function colorTextNodes(rootElement, colors) {
    // Use TreeWalker to find all text nodes iteratively (no recursion = no stack overflow).
    // We also snapshot them into an array BEFORE touching the DOM, so live-NodeList
    // mutation during replaceChild can never cause re-visits or infinite loops.
    var walker = document.createTreeWalker(
        rootElement,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                // Walk up to rootElement; reject any text inside an already-colored span.
                var p = node.parentElement;
                while (p && p !== rootElement) {
                    if (p.dataset && p.dataset.colored === 'true') {
                        return NodeFilter.FILTER_REJECT;
                    }
                    p = p.parentElement;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    // Snapshot first so DOM mutations during replacement don't affect iteration.
    var textNodes = [];
    var n;
    while ((n = walker.nextNode())) {
        textNodes.push(n);
    }

    textNodes.forEach(function(node) {
        // Guard: node may have been detached by an earlier replacement in the same pass.
        if (!node.parentNode) return;

        var text = node.textContent;
        var newHTML = text;
        Object.keys(colors).forEach(function(word) {
            newHTML = newHTML.replace(
                new RegExp('\\b' + word + '\\b', 'g'),
                '<span data-colored="true" style="color:' + colors[word] + ';">' + word + '</span>'
            );
        });
        if (newHTML !== text) {
            var span = document.createElement('span');
            span.dataset.colored = 'true';
            span.innerHTML = newHTML;
            node.parentNode.replaceChild(span, node);
        }
    });
}

  window.toggleDem = function toggleDemographicTable() {
      const resultsDiv = document.getElementById('results');
      // Toggle display between 'none' and 'block'
      if (resultsDiv.style.display === 'none' || resultsDiv.style.display === '') {
          resultsDiv.style.display = 'block'; // or 'table' for the table specifically
      } else {
          resultsDiv.style.display = 'none';
      }
  };
  window.toggleGraph = function toggleGraph() {
      const svgElement = document.getElementById('party_support_history');
      if (svgElement.style.display === 'none' || svgElement.style.display === '') {
          svgElement.style.display = 'block';
      } else {
          svgElement.style.display = 'none';
      }
  };
  window.toggleElectionGraph = function toggleElectionGraph() {
      const svgElement = document.getElementById('election_history');
      if (svgElement.style.display === 'none' || svgElement.style.display === '') {
          svgElement.style.display = 'block';
      } else {
          svgElement.style.display = 'none';
      }
  };
  window.toggleNews = function toggleNews() {
      const elements = document.querySelectorAll('.dnvp');
      const elements2 = document.querySelectorAll('.other');
      const button = document.getElementById('news_tab');

      if (!button) {
          console.error('Button with id "news_tab" not found.');
          return;
      }

      elements.forEach(function (element) {
          if (element.style.display !== 'block') {
              element.style.display = 'block';
              button.innerHTML = "View Other News";
          } else {
              element.style.display = 'none';
              button.innerHTML = "View Right-Wing News";
          }
      });

      elements2.forEach(function (element) {
          if (element.style.display !== 'none') {
              element.style.display = 'none';
          } else {
              element.style.display = 'block';
          }
      });

      button.style.backgroundColor = '#dddddd';
  };

  /*
   * This function copied from the code for Infinite Space Battle Simulator
   *
   * quality - a number between max and min
   * qualityName - the name of the quality
   * max and min - numbers
   * colors - if true/1, will use some color scheme - green to yellow to red for high to low
   * */
  window.generateBar = function(quality, qualityName, max, min, colors) {
      var bar = document.createElement('div');
      bar.className = 'bar';
      var value = document.createElement('div');
      value.className = 'barValue';
      var width = (quality - min)/(max - min);
      if (width > 1) {
          width = 1;
      } else if (width < 0) {
          width = 0;
      }
      value.style.width = Math.round(width*100) + '%';
      if (colors) {
          value.style.backgroundColor = window.probToColor(width*100);
      }
      bar.textContent = qualityName + ': ' + quality;
      if (colors) {
          bar.textContent += '/' + max;
      }
      bar.appendChild(value);
      return bar;
  };
document.addEventListener('keydown', function(event) {
    switch(event.key) {
        case '1': window.dendryUI.dendryEngine.goToScene('rightcomleader'); break;
        case '2': window.dendryUI.dendryEngine.goToScene('leftleader'); break;
        case '3': window.dendryUI.dendryEngine.goToScene('centreleader'); break;
        case '4': window.dendryUI.dendryEngine.goToScene('agsocleader'); break;
        case '5': window.dendryUI.dendryEngine.goToScene('laborleader'); break;
        case '6': window.dendryUI.dendryEngine.goToScene('reformistleader'); break;
        case '7': window.dendryUI.dendryEngine.goToScene('neorevleader'); break;
        case '8': window.dendryUI.dendryEngine.goToScene('leftnatleader'); break;
        case '9': window.dendryUI.dendryEngine.goToScene('liberalleader'); break;
        case '0': window.dendryUI.dendryEngine.goToScene('leftchrisleader'); break;
        case '-': window.dendryUI.dendryEngine.goToScene('businessleader'); break;
    }
});
window._decorateChoices = function() {
    var cardRoutes = {
        'main.party_affairs': 'party_affairs_list',
        'main.gov_affairs': 'gov_affairs_list',
        'main.pres_affairs': 'pres_affairs_list',
        'main.eco_affairs': 'eco_affairs_list',
        'root.rosenfeld_choice': 'root.rosenfeld_chhosen',
        'root.wels_choice': 'root.wels_chosen',
        'root.wissell_choice': 'root.wissell_chosen',
        'root.severing_choice': 'root.severing_chosen'
    };

    document.querySelectorAll('a.card[card-id]').forEach(function(card) {
    var id = card.getAttribute('card-id');
    console.log('[decorator] found card:', id, 'already attached:', !!card.dataset.clickAttached);
        if (cardRoutes[id] && !card.dataset.clickAttached) {
            card.dataset.clickAttached = 'true';
            card.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                window.dendryUI.dendryEngine.goToScene(cardRoutes[id]);
            });
        }
    });
};

function initDecorator() {
    var contentEl = document.getElementById('content');
    if (!contentEl) { setTimeout(initDecorator, 100); return; }

    window._decoObserver = new MutationObserver(function() {
        window._decoObserver.disconnect();
        try { window._decorateChoices(); } catch(e) { console.error('[decorator error]', e); }
        window._decoObserver.observe(contentEl, { childList: true, subtree: true });
    });

    window._decoObserver.observe(contentEl, { childList: true, subtree: true });
    window._decorateChoices();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDecorator);
} else {
    initDecorator();
}


  window.justLoaded = true;
  window.statusTab = "status";
  window.statusTabRight = "status_right";
  window.dendryModifyUI = main;
  console.log("Modifying stats: see dendryUI.dendryEngine.state.qualities");

  window.onload = function() {
    window.dendryUI.loadSettings({show_portraits: true});
    if (window.dendryUI.dark_mode) {
        document.body.classList.add('dark-mode');
    }
    if (window.dendryUI.gray_mode) {
        document.body.classList.add('gray-mode');
    }
    window.pinnedCardsDescription = "Advisor cards - actions are only usable once per 6 months.";
    window.statusTab = "status";
    window.updateSidebar();
    window.statusTabRight = "status_right";
    window.updateSidebarRight();
};

}());