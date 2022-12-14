const socket = io();

const chatForm = document.querySelector('form');
const message = document.querySelector('#msg');
const Sendbutton = document.querySelector('#send');

const $messageform = document.querySelector("#message-form");
const $Input = $messageform.querySelector('input');
const $button = $messageform.querySelector('button');
const $locationButton = document.querySelector("#location");
const $messages = document.querySelector("#messages");
const $messagetemplate = document.querySelector("#message-template").innerHTML;
const $locationtemplate = document.querySelector("#location-template").innerHTML;
const $sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });


const autoscroll = () => {

    /*
      offsetTop is what to use for this. scrollTop returns the amount you scrolled in that particular container. So because inner doesn't have a scrollbar, it never scrolls, and therefore scrollTop is 0.
      But offsetTop, on the other hand, returns the distance of the current element relative to the top of the offsetParent node.
      So the formula to get the amount scrolled of an element based on window, would be:
      inner.offsetTop - document.body.scrollTop;
    */
      // New message element
      const $newMsg = $messages.lastElementChild
    
      // Height of the new message
      const newMsgStyles = getComputedStyle($newMsg) // getComputedStyle() is provided by the browser
      const newMsgMargin = parseInt(newMsgStyles.marginBottom) // convert to number since the value is a string ("16px")
      const newMsgHeight = $newMsg.offsetHeight + newMsgMargin // offsetHeight does not include margins, which is why we calculated them right before
    
      // Visible Height
      const visibleHeight = $messages.offsetHeight
    
      // Container Height
      const containerHeight = $messages.scrollHeight // total height we can scroll through, so total height of the $messages element
    
      // Distance scrolled from top
      const scrollOffset = $messages.scrollTop + visibleHeight // We add the visibleHeight because scrollTop gives us the distance scrolled based on the top of the viewport
    
      // Calculating if we already are at the bottom
      if (containerHeight - newMsgHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight // Setting the scroll bar all the way to the bottom.
        /*
          A pretty cool alternative: $messages.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"})
        */
      }
    
      /*
        Note on the conditional logic, if we are scrolling upwards to see previous messages then the scrollOffset will be a smaller number the higher we go.
        That is why if the total height (containerHeight) - the height of the new message is less than that number, then we know we already are at the bottom.
        This way we won't autoscroll on every incoming message as that would be a bad user experience.
      */
    }

chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    $button.setAttribute('disabled', 'disabled')
    socket.emit('sendMessage', message.value, (message) => {
        $button.removeAttribute('disabled');
        $Input.value = '';
        $Input.focus();
        console.log(message);
    });
});
socket.on('Message', (message) => {
    const html = Mustache.render($messagetemplate, { username: message.username, message: message.text, createdAt: moment(message.createdAt).format('h:mm a') });
    $messages.insertAdjacentHTML('beforeend', html);
    console.log(message);
    autoscroll();
});
socket.on('LocationMessage', (message) => {
    const html = Mustache.render($locationtemplate, { username: message.username, url: message.url, createdAt: moment(message.createdAt).format('h:mm a') });
    $messages.insertAdjacentHTML('beforeend', html);
    console.log(message);
    autoscroll();
});
socket.on('roomData', ({room, users})=>{
    const html = Mustache.render($sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
 
})
document.querySelector("#location").addEventListener('click', (e) => {
    e.preventDefault();
    $locationButton.setAttribute('disabled', 'disabled');
    if (!navigator.geolocation) { 
        return alert('Geolocation is not supported by your browser!!');
    }

    navigator.geolocation.getCurrentPosition((position) => {
        // console.log(position)
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (Locationmessage) => {
            $locationButton.removeAttribute('disabled');
            console.log(Locationmessage);
        })
    })
})


socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});