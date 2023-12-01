var suggestionSelected = false,
  languageCode = "",
  typingTimer,
  doneTypingInterval = 200,
  $textObj,
  dragging = false;

var $suggestionSpan = createSuggestionSpan();

function createSuggestionSpan() {
  return $("<div>", {
    id: "suggestion",
    class: "custom-suggestion-box",
  }).css({
    position: "fixed",
    borderRadius: "8px",
    padding: "10px",
    top: "0px",
    left: "0px",
    width: "auto",
    fontSize: "16px",
    display: "none",
    flexDirection: "column",
    overflowX: "hidden",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
    zIndex: "20000",
    background: "#FFFFFF",
    color: "#333333",
    fontFamily: "Open Sans, sans-serif",
    border: "1px solid #CCCCCC",
    whiteSpace: "nowrap",
    overflowX: "hidden",
  });
}

function applyStyles(cssStyles) {
  var styleElement = $("<style>").attr("type", "text/css");

  if (styleElement[0].styleSheet) {
    styleElement[0].styleSheet.cssText = cssStyles;
  } else {
    styleElement.text(cssStyles);
  }

  $("head").append(styleElement);
}

function getCurrentWord($textObj) {
  var words;

  if ($textObj.is("[contenteditable]")) {
    words = $textObj.text().split(/\s+/);
  } else if ($textObj.is("input:text") || $textObj.is("textarea")) {
    words = $textObj.val().split(/\s+/);
  } else {
    words = [];
  }

  return words.length > 0 ? words[words.length - 1] : "";
}


function insertSuggestion($textObj, selectedSuggestion) {
  var currentWord = getCurrentWord($textObj);
  if ($textObj.is("[contenteditable]")) {
    var sentenceWithoutLastWord = $textObj
      .text()
      .substring(0, $textObj.text().lastIndexOf(" ") + 1);
    $textObj.html(sentenceWithoutLastWord + selectedSuggestion + " ");
  } else if ($textObj.is("input:text") || $textObj.is("textarea")) {
    var sentenceWithoutLastWord = $textObj
      .val()
      .substring(0, $textObj.val().lastIndexOf(" ") + 1);
    $textObj.val(sentenceWithoutLastWord + selectedSuggestion + " ");
  }
  suggestionSelected = true;
  $suggestionSpan.hide().empty();
}

function handleInput($textObj) {
  clearTimeout(typingTimer);

  if (!$suggestionSpan.is(":visible")) {
    $textObj.after($suggestionSpan);
  }

  typingTimer = setTimeout(function () {
    var currentWord = getCurrentWord($textObj);

    if (
      languageCode !== "" &&
      languageCode !== "Select Language" &&
      currentWord.trim() !== ""
    ) {
      fetchSuggestions(currentWord);
    } else {
      $suggestionSpan.hide().empty();
    }
  }, doneTypingInterval);

  if (suggestionSelected) {
    suggestionSelected = false;
    $suggestionSpan.hide().empty();
    var selectedSuggestion = $(".suggestion-item.selected").text();
    updateCurrentWord($textObj, selectedSuggestion);
  }

  $textObj.off("input");

  $textObj[0].dispatchEvent(new Event("input", { bubbles: true }));

  $textObj.on("input", function () {
    handleInput($textObj);
  });
}

function fetchSuggestions(currentWord) {
  const apiUrl =
    "https://api.dhruva.ai4bharat.org/services/inference/transliteration";
  const apiKey =
    "EAMe0BjX5OSO_Rw5BDQZKmhzW1kdXDOZM9eEKYrumLIMlCCHzrUllMn5UU9SZmHa";

  const requestData = {
    input: [
      {
        source: currentWord,
      },
    ],
    config: {
      serviceId: "ai4bharat/indicxlit--cpu-fsv2",
      language: {
        sourceLanguage: "en",
        sourceScriptCode: "",
        targetLanguage: languageCode, 
        targetScriptCode: "",
      },
      isSentence: false,
      numSuggestions: 5,
    },
    controlConfig: {
      dataTracking: true,
    },
  };

  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.output && data.output.length > 0) {
        var suggestionsHtml = data.output[0].target
          .map(
            (suggestion, index) =>
              `<div class="suggestion-item" data-index="${index}" draggable="true">${suggestion}</div>`
          )
          .join("");
        $suggestionSpan
          .html(`<div class="suggestion-handle"></div>` + suggestionsHtml)
          .show();
        dragSuggestionBox();
      }
    });
}

function updateCurrentWord($textObj, selectedSuggestion) {
  var words = $textObj.val().split(/\s+/);
  words[words.length - 1] = selectedSuggestion;
  $textObj.val(words.join(" "));
}

function handleSpaceBar($textObj) {
  var currentWord;
  var sentenceWithoutLastWord;

  if ($textObj.is("[contenteditable]")) {
    currentWord = getCurrentWord($textObj);
    sentenceWithoutLastWord = $textObj
      .text()
      .substring(0, $textObj.text().lastIndexOf(" ") + 1);
  } else if ($textObj.is("input:text") || $textObj.is("textarea")) {
    currentWord = getCurrentWord($textObj);
    sentenceWithoutLastWord = $textObj
      .val()
      .substring(0, $textObj.val().lastIndexOf(" ") + 1);
  }

  var selectedSuggestion =
    $(".suggestion-item.hovered").text() || $(".suggestion-item:first").text();

  if (selectedSuggestion) {
    var newText = sentenceWithoutLastWord + selectedSuggestion + " ";

    if ($textObj.is("[contenteditable]")) {
      $textObj.html(newText);

      var range = document.createRange();
      range.selectNodeContents($textObj[0]);
      range.collapse(false);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    } else if ($textObj.is("input:text") || $textObj.is("textarea")) {
      $textObj.val(newText);

      $textObj[0].setSelectionRange(newText.length, newText.length);
    }

    suggestionSelected = true;

    $textObj.trigger("input");
  }

  return false;
}

function handleEnterKey($textObj, event) {
  var $selectedSuggestion = $(".suggestion-item.selected");

  if ($selectedSuggestion.length) {
    event.preventDefault();

    var selectedSuggestion = $selectedSuggestion.text();
    insertSuggestion($textObj, selectedSuggestion);

    if ($textObj.is("[contenteditable]")) {
      var textNode = $textObj[0].firstChild;
      var range = document.createRange();
      range.setStart(textNode, textNode.length);
      range.collapse(true);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    } else if ($textObj.is("input:text") || $textObj.is("textarea")) {
      $textObj[0].setSelectionRange(
        $textObj.val().length,
        $textObj.val().length
      );
    }

    $selectedSuggestion.removeClass("selected");
    $suggestionSpan.hide().empty();

    return false;
  }

  return true;
}

function handleArrowKeys($textObj, keyCode) {
  var $suggestions = $(".suggestion-item");
  var currentIndex = $suggestions.index($(".suggestion-item.selected"));
  var totalSuggestions = $suggestions.length;

  if (keyCode === 38) {
    currentIndex = Math.max(currentIndex - 1, 0);
  } else if (keyCode === 40) {
    currentIndex = Math.min(currentIndex + 1, totalSuggestions - 1);
  }

  $suggestions.removeClass("selected hovered");
  var $selectedSuggestion = $suggestions
    .eq(currentIndex)
    .addClass("selected hovered");

  var suggestionsContainer = $suggestionSpan.get(0);
  var selectedSuggestionPosition = $selectedSuggestion.position().top;
  var containerScrollTop = suggestionsContainer.scrollTop;
  var containerHeight = suggestionsContainer.clientHeight;

  if (selectedSuggestionPosition < 0) {
    suggestionsContainer.scrollTop =
      containerScrollTop + selectedSuggestionPosition;
  } else if (
    selectedSuggestionPosition + $selectedSuggestion.height() >
    containerHeight
  ) {
    suggestionsContainer.scrollTop =
      containerScrollTop +
      selectedSuggestionPosition +
      $selectedSuggestion.height() -
      containerHeight;
  }

  if (keyCode === 13) {
    var selectedSuggestion = $(".suggestion-item.selected").text();
    if (selectedSuggestion) {
      insertSuggestion($textObj, selectedSuggestion);
      suggestionSelected = true;
      $suggestionSpan.hide().empty();
      return false;
    }
  }

  return false;
}

$("body").on("focus", "[contenteditable],input, textarea", function () {
  $textObj = $(this);

  $textObj.off("input").on("input", function () {
    handleInput($textObj);
  });

  $textObj.off("blur").on("blur", function () {
    $suggestionSpan.hide().empty();
    suggestionSelected = false;
  });

  $textObj.off("keydown").on("keydown", function (e) {
    if (!$suggestionSpan.is(":visible")) {
      return;
    }

    var keyCode = e.keyCode || e.which;

    if (keyCode === 38 || keyCode === 40) {
      e.preventDefault();
    }

    if (keyCode == 27) {
      $suggestionSpan.hide().empty();
      suggestionSelected = false;
    } else if (keyCode === 32 || keyCode === 13) {
      e.preventDefault();

      if (suggestionSelected) {
        suggestionSelected = false;
        $suggestionSpan.hide().empty();
      } else {
        handleSpaceBar($textObj);
      }
    } else if (keyCode === 38 || keyCode === 40) {
      handleArrowKeys($textObj, keyCode);
    }

    if (keyCode === 13) {
      var selectedSuggestion = $(".suggestion-item.selected").text();
      if (selectedSuggestion) {
        insertSuggestion($textObj, selectedSuggestion);
        suggestionSelected = true;
        $suggestionSpan.hide().empty();
      }
    }
  });
});

$suggestionSpan.on("mouseenter", ".suggestion-item", function () {
  $suggestionSpan.find(".suggestion-item").removeClass("selected hovered");
  $(this).addClass("selected hovered");
});

$suggestionSpan.on("mouseleave", ".suggestion-item", function () {
  $(this).removeClass("selected hovered");
});

$suggestionSpan.on("mousedown", ".suggestion-item", function (e) {
  e.preventDefault();

  var selectedSuggestion = $(this).text();
  insertSuggestion($textObj, selectedSuggestion);

  if ($textObj.is("[contenteditable]")) {
    var textNode = $textObj[0].firstChild;
    var range = document.createRange();
    range.setStart(textNode, textNode.length);
    range.collapse(true);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  } else if ($textObj.is("textarea")) {
    $textObj[0].setSelectionRange($textObj.val().length, $textObj.val().length);
  }

  $textObj.trigger("input");
});

function dragSuggestionBox() {
  var suggestionBox = document.getElementById("suggestion");
  var offsetX, offsetY;

  suggestionBox.addEventListener("mousedown", function (e) {
    e.preventDefault();
    offsetX = e.clientX - suggestionBox.getBoundingClientRect().left;
    offsetY = e.clientY - suggestionBox.getBoundingClientRect().top;

    document.addEventListener("mousemove", elementDrag);
    document.addEventListener("mouseup", closeDragElement);
  });

  function elementDrag(e) {
    e.preventDefault();
    var x = e.clientX - offsetX;
    var y = e.clientY - offsetY;

    x = Math.min(Math.max(x, 0), window.innerWidth - suggestionBox.offsetWidth);
    y = Math.min(
      Math.max(y, 0),
      window.innerHeight - suggestionBox.offsetHeight
    );

    suggestionBox.style.left = x + "px";
    suggestionBox.style.top = y + "px";
  }

  function closeDragElement() {
    document.removeEventListener("mousemove", elementDrag);
    document.removeEventListener("mouseup", closeDragElement);
  }
}


$("body").append($suggestionSpan);
var cssStyles = `
.custom-suggestion-box .close-button {
  position: absolute;
  top: 8px;
  right: 8px;
  cursor: pointer;
  color: #000;
}

.suggestion-item.selected, .suggestion-item.hovered {
  background-color: #333333;
  color: #fff;
}

.suggestion-handle {
  position: absolute;
  top: 0;
  left: 50%;
  width: 30px;
  height: 5px;
  cursor: move;
  background-color: #333333;
  border-radius: 4px;
  transform: translateX(-50%);
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-bottom: 5px;
  margin-top: 5px;
  color: black;
  font-family: "Open Sans", sans-serif;
  cursor: pointer;
}
.suggestion-item.selected, .suggestion-item.hovered {
  background-color: #f25a25;
  color: #fff;
}

.suggestion-item:hover {
  background-color: #f25a25;
  cursor: pointer;
  color: #fff;
}



.custom-suggestion-box {
  position: fixed;
  top: 50%;
  left: 50%;
  z-index: 20000;
  background-color: #fff;
  border-radius: 8px;
    overflow: visible;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);

  
}

.custom-suggestion-box .close-button {
  position: absolute;
  top: 8px;
  right: 8px;
  cursor: pointer;
  color: #000;
}
.suggestion-item.selected, .suggestion-item.hovered {
  background-color: #333333;
  color: #fff;
}

.suggestion-handle {
  position: absolute;
  top: 0;
  left: 50%;
  width: 30px;
  height: 5px;
  cursor: move;
  background-color: #333333;
  border-radius: 4px;
  transform: translateX(-50%);
}

.suggestion-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px;
  border: 1px solid #ccc;
  border-radius: 8px;
  margin-bottom: 5px;
  margin-top: 5px;
  color: black;
  font-family: "Open Sans", sans-serif;
  cursor: pointer;
}
  .suggestion-item.selected, .suggestion-item.hovered {
    background-color: #F25A25;
    color: #fff;
  }

  
.custom-suggestion-box {
  cursor: grab;
  cursor: -webkit-grab;
}

.custom-suggestion-box:hover {
  cursor: grabbing;
  cursor: -webkit-grabbing;
}
.custom-suggestion-box {
  opacity: 0.9;
}

.custom-suggestion-box:hover {
  opacity: 1;
}

  .suggestion-item:hover {
    background-color: #F25A25;
    cursor: pointer;
    color: #fff;
  }
  .custom-suggestion-box {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 20000;
  cursor: grabbing;
  cursor: -webkit-grabbing;
}
.custom-suggestion-box.dragging {
  opacity: 0.9;
}
.custom-suggestion-box:hover {
  cursor: grabbing;
  cursor: -webkit-grabbing;
}
`;

applyStyles(cssStyles);
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "updateLanguage") {
    languageCode = request.languageCode;
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const languageSelect = document.getElementById("languageSelect");

  const selectedLanguage = localStorage.getItem("selectedLanguage");

  if (selectedLanguage) {
    languageSelect.value = selectedLanguage;
  }

  languageSelect.addEventListener("change", function () {
    const selectedLanguage = languageSelect.value;

    if (selectedLanguage !== "") {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, {
          action: "updateLanguage",
          languageCode: selectedLanguage,
        });

        localStorage.setItem("selectedLanguage", selectedLanguage);
      });
    }
  });
});

