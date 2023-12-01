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
