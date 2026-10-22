(function(){'use strict';
function refresh(){var now=Date.now(),up=document.getElementById('upcomingEvents'),past=document.getElementById('pastEvents');
document.querySelectorAll('[data-event-end]').forEach(function(card){var end=Date.parse(card.dataset.eventEnd);(Number.isFinite(end)&&end>now?up:past).appendChild(card);});
document.getElementById('noUpcoming').hidden=up.children.length>0;
}refresh();setInterval(refresh,60000);})();
