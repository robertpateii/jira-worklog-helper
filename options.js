// Saves options to chrome.storage
function save_options() {
  var project = document.getElementById('project').value;
  var browse = document.getElementById('browse').value;
  chrome.storage.sync.set({
    projectID: project,
    browsePath: browse
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
      status.textContent = '';
    }, 1000);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    projectID: '',
    browsePath: ''
  }, function(items) {
    document.getElementById('project').value = items.projectID;
    document.getElementById('browse').value = items.browsePath;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);
