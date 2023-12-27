document.addEventListener("DOMContentLoaded", function () {
  const languageSelect = document.getElementById("languageSelect");

  // Load the selected language from localStorage
  const selectedLanguage = localStorage.getItem("selectedLanguage");

  if (selectedLanguage) {
    // Set the selected language in the dropdown
    languageSelect.value = selectedLanguage;
  }

  languageSelect.addEventListener("change", function () {
    const selectedLanguage = languageSelect.value;

    if (selectedLanguage !== "") {
      browser.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const activeTab = tabs[0];
        browser.tabs.sendMessage(activeTab.id, {
          action: "updateLanguage",
          languageCode: selectedLanguage,
        });

        // Save the selected language to localStorage
        localStorage.setItem("selectedLanguage", selectedLanguage);
      });
    }
  });
});
