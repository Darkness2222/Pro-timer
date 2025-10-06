export const playSound = (soundType = 'beep') => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    switch (soundType) {
      case 'start':
        oscillator.frequency.value = 800
        gainNode.gain.value = 0.3
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.1)
        break
      case 'pause':
        oscillator.frequency.value = 600
        gainNode.gain.value = 0.3
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.1)
        break
      case 'finish':
        oscillator.frequency.value = 1000
        gainNode.gain.value = 0.3
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.15)
        setTimeout(() => {
          const osc2 = audioContext.createOscillator()
          const gain2 = audioContext.createGain()
          osc2.connect(gain2)
          gain2.connect(audioContext.destination)
          osc2.frequency.value = 1200
          gain2.gain.value = 0.3
          osc2.start()
          osc2.stop(audioContext.currentTime + 0.15)
        }, 150)
        break
      case 'overtime':
        oscillator.frequency.value = 400
        gainNode.gain.value = 0.4
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.2)
        break
      case 'warning':
        oscillator.frequency.value = 700
        gainNode.gain.value = 0.3
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.1)
        setTimeout(() => {
          const osc2 = audioContext.createOscillator()
          const gain2 = audioContext.createGain()
          osc2.connect(gain2)
          gain2.connect(audioContext.destination)
          osc2.frequency.value = 700
          gain2.gain.value = 0.3
          osc2.start()
          osc2.stop(audioContext.currentTime + 0.1)
        }, 120)
        break
      default:
        oscillator.frequency.value = 800
        gainNode.gain.value = 0.3
        oscillator.start()
        oscillator.stop(audioContext.currentTime + 0.1)
    }
  } catch (error) {
    console.error('Error playing sound:', error)
  }
}

export const vibrate = (pattern = 200) => {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  } catch (error) {
    console.error('Error vibrating:', error)
  }
}

export const requestFullscreen = () => {
  try {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
      elem.requestFullscreen()
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen()
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen()
    }
  } catch (error) {
    console.error('Error requesting fullscreen:', error)
  }
}

export const exitFullscreen = () => {
  try {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    }
  } catch (error) {
    console.error('Error exiting fullscreen:', error)
  }
}
