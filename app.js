let ctx, analyser, data, bgstate, visualizing, perms, stream, hv, sv
const bgstates = ["bass", "mid", "high", "off"]
bgstate = 0
visualizing = false
perms = false
hv = 200
sv = 80

alert("If you go blind or something bad happens to you from watching this then this is not my fault. This is your warning so beware.")

document.getElementById('vsettingsui').style.display = 'none'

document.getElementById('start').addEventListener('click', async () => {
    if (visualizing) {
        document.getElementById('start').innerHTML = "Start visualizer"
        return visualizing = false
    }
    try {
        if (!perms) {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        }
        ctx = new (window.AudioContext || window.webkitAudioContext)()
        const src = ctx.createMediaStreamSource(stream)
        analyser = ctx.createAnalyser()
        analyser.fftSize = 1024
        src.connect(analyser)
        analyser.smoothingTimeConstant = 0.75
        data = new Uint8Array(analyser.frequencyBinCount)
        document.getElementById('start').innerHTML = "Stop visualizer"
        visualizing = true
        perms = true
        loop()
    } catch (err) {
        perms = false
        alert("Mic permissions needed to visualize audio input")
    }
})

document.getElementById("bgtoggle").addEventListener('click', () => {
    bgstate + 1 == 4 ? bgstate = 0 : bgstate += 1
    document.getElementById("bgtoggle").innerHTML = `Background reaction toggle - ${bgstates[bgstate]}`
})

document.getElementById('vsettings').addEventListener('click', () => {
  document.getElementById('vsettingsui').style.display = document.getElementById('vsettingsui').style.display === 'none' ? 'flex' : 'none';
})

document.getElementById('setcolor').addEventListener('click', () => {
    document.getElementById('bass').setAttribute('style', `background-color: ${document.getElementById('basscolor').value}`)
    document.getElementById('mid').setAttribute('style', `background-color: ${document.getElementById('midcolor').value}`)
    document.getElementById('high').setAttribute('style', `background-color: ${document.getElementById('highcolor').value}`)

    const hex = document.getElementById('bgcolor').value

    let r = parseInt(hex.slice(1, 3), 16) / 255
    let g = parseInt(hex.slice(3, 5), 16) / 255
    let b = parseInt(hex.slice(5, 7), 16) / 255

    let max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2
    let d = max - min

    if (d) {
        s = d / (1 - Math.abs(2 * l - 1))
        if (max === r) h = ((g - b) / d) % 6
        else if (max === g) h = (b - r) / d + 2
        else h = (r - g) / d + 4
        hv = Math.round(h * 60)
        if (hv < 0) hv += 360
    }

    sv = Math.round(s * 100)

})

function band(db, source, destination) {
    const nyquist = ctx.sampleRate / 2
    const i0 = Math.max(0, Math.floor(source / nyquist * db.length))
    const i1 = Math.min(db.length - 1, Math.floor(destination / nyquist * db.length))
    let sum = 0
    for (let i = i0; i <= i1; i++) sum += db[i]
    return sum / (i1 - i0 + 1);
}

function colors(b, m, h) {
    const clamp = (v) => Math.max(0, Math.min(1, ((v - 60) / 140)))
    const c1 = `hsl(${200 + clamp((b - 60) / 140) * 40}, 80%, ${20 + clamp((b - 60) / 140) * 40}%)`
    const c2 = `hsl(${280 + clamp((m - 60) / 140) * 40}, 80%, ${15 + clamp((m - 60) / 140) * 45}%)`
    const c3 = `hsl(${240 + clamp((h - 60) / 140) * 40}, 80%, ${10 + clamp((h - 60) / 140) * 50}%)`
    return [c1, c2, c3]
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function defaultthingy(bass, mid, high, v) {
    bass = parseInt(bass.slice(0, -2), 10)
    mid = parseInt(mid.slice(0, -2), 10)
    high = parseInt(high.slice(0, -2), 10)

    while (bass > 0 && visualizing === false) {
        if (bass < 5) bass = 0;

        document.getElementById('bass').style.height = `${bass}px`
        document.getElementById('bass').style.width = `${bass}px`

        document.getElementById('mid').style.width = `${mid}px`
        document.getElementById('mid').style.height = `${mid}px`

        document.getElementById('high').style.height = `${high}px`
        document.getElementById('high').style.width = `${high}px`

        document.body.style.background = `hsl(200, 80%, ${Math.max(0, v)}%)`

        if (mid > 0) mid -= 2;
        if (high > 0) high -= 2;
        if (v > 0) v -= 1.5;

        if (mid < 0) mid = 0;
        if (high < 0) high = 0;

        bass -= 2

        await sleep(2);
    }
}

function loop() {
    analyser.getByteFrequencyData(data)
    const b = band(data, 20, 160)
    const m = band(data, 160, 2000)
    const h = band(data, 2000, 8000)

    // Math time, yay
    const bass = `${b * 800 / 255}px`
    const mid = `${m * 550 / 255}px`
    const high = `${h * 300 / 255}px`
    /*
    Equivalent of solving with ratios, ex: b/255 = x/800 while solving for x
    Explanation because idk:
        b because that's the bass value over 255 (what the bass value is out of, or its max) is equal to x (the size of the new circle we are solving for)
        over 800 (the max pixels the circle is out of). It would look something like this and we act like b is not unknown because it's substituted later anyways:
            b   x
            - = -
           255 800
        We would basically cross-multiply to get 800b = 255x. If this doesn't make sense then that sucks because I'm done teaching. I need to finish homework so no more documentation today.
    */ 

    if (!visualizing) return defaultthingy(bass, mid, high, bgstate == 0 ? b : bgstate == 1 ? m : bgstate == 2 ? h : 2 / 2);
    requestAnimationFrame(loop)

    document.getElementById('bass').style.height = bass
    document.getElementById('bass').style.width = bass

    document.getElementById('mid').style.width = mid
    document.getElementById('mid').style.height = mid

    document.getElementById('high').style.height = high
    document.getElementById('high').style.width = high

    document.body.style.background = `hsl(${hv}, ${sv}%, ${bgstate == 0 ? b : bgstate == 1 ? m : bgstate == 2 ? h : 2 / 2}%)`

}
