var heart = 5;
var level = 8000
var diem = 0
var chau = $('.chau')[0]

events=document.addEventListener('keydown', logKey);
function logKey(e) {
    var left =chau.style.left.replace(/[^0-9,.]/g, '')-'0';
    if(e.which==39 && left<375){
        chau.style.left = `${left + 75}px`
    } else if(e.which==37 && left>0){
        chau.style.left = `${left - 75}px`
    }
}
//Animate
animate = setInterval(function(){
    $('.img').each(function(e){
        _this=$(this)[0]
        if(_this.style.top=='2600px'){
            heart--
            _this.remove()       
        }
    }
    );
},50)

//Ramdom img
randomimg = setInterval(random,800)
function random(){
    let col = Math.floor(Math.random() * 6)*300
    let img = Math.floor(Math.random() * 15)+1
    $('#canvas').append(       
        `<div class="img" style="transform: translateX(${col}px);">
            <svg class="defs">
                <defs>
                    <clipPath id="heart-clip">
                        <path id="heart" d="M248.078,5.883c-36.691-14.739-77.771-0.839-98.517,31.125C128.817,5.044,87.735-8.856,51.043,5.883 C9.354,22.632-10.863,70.009,5.887,111.696c16.06,39.98,143.314,139.607,143.314,139.607l0.359,0.28l0.36-0.28 c0,0,127.251-99.627,143.314-139.607C309.986,70.009,289.768,22.632,248.078,5.883z"/>
                    </clipPath>
                </defs>
            </svg>
            <div class="demo heart">
                <svg width="300" height="300">
                    <image href=./img/ld${img}.jpg />
                </svg>              
            </div>
        </div>`
    )
    $('.img').animate({
        top:'2600px'
    },level)
}
//Check
check=setInterval(function(){
    document.getElementById('diem').textContent= `Điểm: ${diem}`
    document.getElementById('heart').textContent= `Heart: ${heart}`
    if(diem>=5000){
        level=3500
    } else if(diem>=4000){
        level=4000
    } else if(diem>=3000){
        level=4500
    }else if(diem>=2000){
        level=5000
    }else if(diem>=1000){
        level=5500
    }else if(diem>=500){
        level=6000
    } else level=8000
    if(heart<=0){
        clearInterval(animate)
        clearInterval(randomimg)
        clearInterval(check)
        $('.img').each(function(e){
            _this=$(this)[0]
            _this.remove()           
        }
        )
        alert(`Điểm cao: ${diem}`)
        location.reload()
    }
    $('.img').each(function(){
        _thisX=$(this)[0].style.transform.replace(/[^0-9,.]/g, '')-'0'        
        _thisY=$(this)[0].style.top.replace(/[^0-9,.]/g, '')-'0'
        _thisC=chau.style.left.replace(/[^0-9,.]/g, '')-'0'
        _this=$(this)[0]
        if(_thisX/4==_thisC && _thisY>2400) {
           _this.remove()
           diem+=10
        }
    }
    );
},10)



