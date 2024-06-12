var previousURL = '';
const ID_Student = undefined; // Put your Student ID here
var ID_course = undefined
var auth_token = undefined
var youCanSign = false

const MODAL_TEXT_GLITCH = `
<div>
    <button style="border-radius: 5px; cursor: pointer; background-color: aliceblue;" id="wtf-file-select">Signer</button>
    <input type="file" id="wtf-file-elem" accept="image/*" style="display:none;" />
</div>
`;

const MODAL_TEXT = `
<div">
    <button style="width: 50%; height: 45px; border-radius: 5px; cursor: pointer; background-color: aliceblue;" id="wtf-file-select">Signer avec une image</button>
    <input type="file" id="wtf-file-elem" accept="image/*" style="display:none;" />
</div>
`;

setInterval(() => {
    document.querySelector('.client-logo').src = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRjwsG-OSdtLPxvWFLaPWykJE4fDOaP4faQFw&usqp=CAU"
    if (previousURL != document.URL) {
        if (document.URL == 'https://app.sowesign.com/student/detection' && youCanSign) {
            displayButton();
        }
        if (document.URL == 'https://app.sowesign.com/student/detection') {
            signCourse()
        }
        if(document.URL == 'https://app.sowesign.com/student/signature' || document.URL == 'https://app.sowesign.com/student/recoveries' && !youCanSign) {
            signWithImg(html = MODAL_TEXT)
        }
        previousURL = document.URL;
    }
}, 500);

const getDate = (format = 1) => {
    const date = new Date(Date.now());

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Les mois commencent à 0, donc +1
    const day = String(date.getDate()).padStart(2, '0');


    // 2024-02-26T10:45:13+01:00
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const timeZoneOffset = -date.getTimezoneOffset();
    const timeZoneOffsetHours = Math.floor(Math.abs(timeZoneOffset) / 60).toString().padStart(2, '0');
    const timeZoneOffsetMinutes = (Math.abs(timeZoneOffset) % 60).toString().padStart(2, '0');
    const timeZoneSign = timeZoneOffset >= 0 ? '+' : '-';
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timeZoneSign}${timeZoneOffsetHours}:${timeZoneOffsetMinutes}`;


}

const getCousesInfo = (token) => {
    const date = new Date(Date.now());

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Les mois commencent à 0, donc +1
    const day = String(date.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;

    return fetch(`https://app.sowesign.com/api/student-portal/courses?from=${formattedDate}&to=${formattedDate}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
    })
}

function isTimeBetween(startTimeStr, endTimeStr, targetTimeStr) {
    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);
    const targetTime = new Date(targetTimeStr);
    return targetTime >= startTime && targetTime <= endTime;
}

const areYourPresent = async (token, id) => {
    return fetch(`https://app.sowesign.com/api/student-portal/courses/${id}/assiduity`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }).then(async (res) => {
        return res.json().then(data => {
            if (data.status == "present") {
                return true
            } return false
        })
    })
}

const displayButton = () => {
    setFireworksStyle();
    document.querySelector('.detection-container.ng-star-inserted').innerHTML += `
        <div class="firework"></div>
        <div class="firework"></div>
        <div class="firework"></div>
    `
    signWithImg(html = MODAL_TEXT_GLITCH, document.querySelector('.grey.italic.little-text.align-right.ng-star-inserted'))
}

const canSign = (start, end) => {
    const date = getDate()
    const jour = date.split("T")[0]
    return isTimeBetween(`${jour}T${start}`, `${jour}T${end}`, date)
}

const signCourse = async () => {
    const tok = await cookieStore.get('token')
    const { token } = JSON.parse(tok.value)
    auth_token = token

    getCousesInfo(token).then(async response => {
        response.json().then(data => {
            console.log("cours de la journée: ");
            data.forEach(async ({ id, signature, end, start }) => {
            const didyousign = signature?.status
            if (!didyousign && canSign(start, end)) {
                console.log(`signature du cours possible id ${id}`);
                youCanSign = true
                ID_course = id
                displayButton();
            }
        })
        })
        
    })
}

const sign = async (courseId, token, fileDataUrl) => {
    if(!courseId || !token || !fileDataUrl) return
    await fetch("https://app.sowesign.com/api/student-portal/signatures", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            course: courseId,
            signer: ID_Student,
        })
    });
    fetch("https://app.sowesign.com/api/student-portal/signatures", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            course: courseId,
            signer: ID_Student,
            status: "present",
            collectedOn: getDate(),
            file: fileDataUrl
        })
    }).then(response => {
        console.log(response.status);
        if (response.status == 201) {
            console.log('your present !');
            location.reload()
        } else {
            response.json().then(data => {
                console.log(data);
            })
        }
    })
}

const tryCode = (token, idCours, i = 0) => {
    console.log(`tentative: ${i}`)
    if (i <= 9999) {
        // Formater le nombre avec 5 chiffres
        let primary = "0"
        let codegen = i.toString().padStart(4, '0');
        let code = primary + codegen

        fetch(`https://app.sowesign.com/api/student-portal/courses/${idCours}/checkcode`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ type: 2, value: code })
        }).then(response => {
            if (response.ok) {
                console.log("Le code est :", code);
                alert(`le code est: `, code)
                return
            } else {
                i++
                tryCode(token, idCours, i)
            }
        }).catch(err => { console.log(err.message); })
    }
}

const findTodayCourseCode = async () => {
    const signed = (signature) => signature ? 'present' : 'absent'
    const tok = await cookieStore.get('token')
    const { token } = JSON.parse(tok.value)

    const date = new Date(Date.now());

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Les mois commencent à 0, donc +1
    const day = String(date.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;

    fetch(`https://app.sowesign.com/api/student-portal/courses?from=${formattedDate}&to=${formattedDate}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        },
    }).then(response => {
        response.json().then(data => {
            console.log("cours de la journée: ");
            console.log(data);
            data.forEach(({ id, name, signature }) => {
                console.log(`Pour le cours ${name} (${id}) vous êtes ${signed()}`);
                if (!signature) {
                    console.log('Début du bruteforce...');
                    tryCode(token, id)
                }
            });
        })
    })
}

const draw = url => {
    var image = new Image();
    var canvas = document.getElementsByTagName('canvas')[0];


    if (!canvas) {
        canvas = document.createElement('CANVAS');
    }
    var context = canvas.getContext('2d');
    image.src = url;

    image.onload = () => {

        canvas.width = 498;
        canvas.height = 332;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        var pngDataUrl = canvas.toDataURL('image/png');
        var pngImage = new Image();
        pngImage.src = pngDataUrl;
        pngImage.onload = () => {
            context.drawImage(pngImage, 0, 0);
            if(youCanSign) {
                sign(ID_course, auth_token, pngDataUrl)
            }
        }
    }
}

const signWithImg = (html, container = document.getElementsByClassName('text center border-radius padding-xs white cursor-pointer')[0]) => {

    if(!container) return

    container.innerHTML = html;

    document.getElementById('wtf-file-select').onclick = e => {
        e.stopPropagation();
        document.getElementById('wtf-file-elem').click();
    }

    document.getElementById('wtf-file-elem').onchange = e => {
        e.stopPropagation();
        if (e.target.files.length == 1) {
            var url = URL.createObjectURL(e.target.files[0]);
            draw(url);
        }
    }
    document.getElementById('wtf-file-elem').onclick = e => {
        e.stopPropagation();
    }

}

const setFireworksStyle = () => {
    document.querySelector('head').innerHTML += `
        <style>
        @keyframes firework {
            0% { transform: translate(var(--x), var(--initialY)); width: var(--initialSize); opacity: 1; }
            50% { width: 2vmin; opacity: 1; }
            100% { width: var(--finalSize); opacity: 0; }
          }
          
          /* @keyframes fireworkPseudo {
            0% { transform: translate(-50%, -50%); width: var(--initialSize); opacity: 1; }
            50% { width: 2vmin; opacity: 1; }
            100% { width: var(--finalSize); opacity: 0; }
          }
           */
          .firework,
          .firework::before,
          .firework::after
          {
            --initialSize: 1.2vmin;
            --finalSize: 45vmin;
            --particleSize: 1vmin;
            --color1: yellow;
            --color2: khaki;
            --color3: white;
            --color4: lime;
            --color5: gold;
            --color6: mediumseagreen;
            --y: -30vmin;
            --x: -50%;
            --initialY: 60vmin;
            content: "";
            animation: firework 2s infinite;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, var(--y));
            width: var(--initialSize);
            aspect-ratio: 1;
            background: 
              /*
              radial-gradient(circle, var(--color1) var(--particleSize), #0000 0) 0% 0%,
              radial-gradient(circle, var(--color1) var(--particleSize), #0000 0) 100% 0%,
              radial-gradient(circle, var(--color1) var(--particleSize), #0000 0) 100% 100%,
              radial-gradient(circle, var(--color1) var(--particleSize), #0000 0) 0% 100%,
              */
              
              radial-gradient(circle, var(--color1) var(--particleSize), #0000 0) 50% 0%,
              radial-gradient(circle, var(--color2) var(--particleSize), #0000 0) 100% 50%,
              radial-gradient(circle, var(--color3) var(--particleSize), #0000 0) 50% 100%,
              radial-gradient(circle, var(--color4) var(--particleSize), #0000 0) 0% 50%,
              
              /* bottom right */
              radial-gradient(circle, var(--color5) var(--particleSize), #0000 0) 80% 90%,
              radial-gradient(circle, var(--color6) var(--particleSize), #0000 0) 95% 90%,
              radial-gradient(circle, var(--color1) var(--particleSize), #0000 0) 90% 70%,
              radial-gradient(circle, var(--color2) var(--particleSize), #0000 0) 100% 60%,
              radial-gradient(circle, var(--color3) var(--particleSize), #0000 0) 55% 80%,
              radial-gradient(circle, var(--color4) var(--particleSize), #0000 0) 70% 77%,
              
              /* bottom left */
              radial-gradient(circle, var(--color5) var(--particleSize), #0000 0) 22% 90%,
              radial-gradient(circle, var(--color6) var(--particleSize), #0000 0) 45% 90%,
              radial-gradient(circle, var(--color1) var(--particleSize), #0000 0) 33% 70%,
              radial-gradient(circle, var(--color2) var(--particleSize), #0000 0) 10% 60%,
              radial-gradient(circle, var(--color3) var(--particleSize), #0000 0) 31% 80%,
              radial-gradient(circle, var(--color4) var(--particleSize), #0000 0) 28% 77%,
              radial-gradient(circle, var(--color5) var(--particleSize), #0000 0) 13% 72%,
              
              /* top left */
              radial-gradient(circle, var(--color6) var(--particleSize), #0000 0) 80% 10%,
              radial-gradient(circle, var(--color1) var(--particleSize), #0000 0) 95% 14%,
              radial-gradient(circle, var(--color2) var(--particleSize), #0000 0) 90% 23%,
              radial-gradient(circle, var(--color3) var(--particleSize), #0000 0) 100% 43%,
              radial-gradient(circle, var(--color4) var(--particleSize), #0000 0) 85% 27%,
              radial-gradient(circle, var(--color5) var(--particleSize), #0000 0) 77% 37%,
              radial-gradient(circle, var(--color6) var(--particleSize), #0000 0) 60% 7%,
              
              /* top right */
              radial-gradient(circle, var(--color1) var(--particleSize), #0000 0) 22% 14%,
              radial-gradient(circle, var(--color1) var(--particleSize), #0000 0) 45% 20%,
              radial-gradient(circle, var(--color1) var(--particleSize), #0000 0) 33% 34%,
              radial-gradient(circle, var(--color1) var(--particleSize), #0000 0) 10% 29%,
              radial-gradient(circle, var(--color1) var(--particleSize), #0000 0) 31% 37%,
              radial-gradient(circle, var(--color1) var(--particleSize), #0000 0) 28% 7%,
              radial-gradient(circle, var(--color1) var(--particleSize), #0000 0) 13% 42%
              ;
            background-size: var(--initialSize) var(--initialSize);
            background-repeat: no-repeat;
          }
          
          .firework::before {
            --x: -50%;
            --y: -50%;
            --initialY: -50%;
          /*   transform: translate(-20vmin, -2vmin) rotate(40deg) scale(1.3) rotateY(40deg); */
            transform: translate(-50%, -50%) rotate(40deg) scale(1.3) rotateY(40deg);
          /*   animation: fireworkPseudo 2s infinite; */
          }
          
          .firework::after {
            --x: -50%;
            --y: -50%;
            --initialY: -50%;
          /*   transform: translate(44vmin, -50%) rotate(170deg) scale(1.15) rotateY(-30deg); */
            transform: translate(-50%, -50%) rotate(170deg) scale(1.15) rotateY(-30deg);
          /*   animation: fireworkPseudo 2s infinite; */
          }
          
          .firework:nth-child(2) {
            --x: 30vmin;
          }
          
          .firework:nth-child(2),
          .firework:nth-child(2)::before,
          .firework:nth-child(2)::after {
            --color1: pink;
            --color2: violet;
            --color3: fuchsia;
            --color4: orchid;
            --color5: plum;
            --color6: lavender;  
            --finalSize: 40vmin;
            left: 30%;
            top: 60%;
            animation-delay: -0.25s;
          }
          
          .firework:nth-child(3) {
            --x: -30vmin;
            --y: -50vmin;
          }
          
          .firework:nth-child(3),
          .firework:nth-child(3)::before,
          .firework:nth-child(3)::after {
            --color1: cyan;
            --color2: lightcyan;
            --color3: lightblue;
            --color4: PaleTurquoise;
            --color5: SkyBlue;
            --color6: lavender;
            --finalSize: 35vmin;
            left: 70%;
            top: 60%;
            animation-delay: -0.4s;
          }
          body {
            overflow: hidden !important; /* Hide scrollbars */
          }
        </style>
    `
}