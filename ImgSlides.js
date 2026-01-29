import Button from '../../commons/button/Button.js';

export default class ImgSlides extends HTMLElement {
	/*
		@Attributes
			[data-scroll]		// true, false
		@Attributes-JS
			[data-transtime]	// 4 (seconds)
			[data-bullets]		// true, false
			[data-controls]		// true, false, play, pause, arrows
			[data-state]		// play, pause
			[data-arrows]		// value accepted by Button class (unicode name)
								// direction will be adjusted: singleLeftPointingAngleQuotationMark -> singleRightPointingAngleQuotationMark
		@Attributes-CSS
			[data-filter]		// sepia, grey, shadow
			[data-transfx]		// flash, grey, blend, slide
			[data-layout]		// flex-columns, flex-masonry, flex-grow
		@Children
			<img>
		Description
			Similar to <img-dialog>. Difference: It's not a subcomponent but a standalone img presenter.
	*/ 

	static observedAttributes = ['data-transtime']

	static dictionary = {
		'left': {
			de: 'Bild zurück',
			en: 'One image back'
		},
		'right': {
			de: 'Bild vorwärts',
			en: 'One image forward'
		},
	}

	_log = false
	_currIndex = 0
	_slideReverse = false
	_intervallID
	_bulletsCreated
	
	get transtime() {
		return Number(this.dataset.transtime) * 1000;
	}

	set currIndex(newIndex) {

		let oldIndex = this._currIndex // returns this._selectedIndex as a number

		// checks
		if (newIndex > this._imgs.length - 1) return // return if beyond last item
		if (newIndex < 0) return // return if beyond first item
		if (newIndex === undefined) return
		// change
		this._currIndex = newIndex // update index

		// action
		this._updateClasses(oldIndex, newIndex)
	}

	get currIndex() {
		return Number(this._currIndex)
	}

	constructor() {
		super()
	}

	attributeChangedCallback(name, oldValue, newValue) {

		if (oldValue === null) return // prevent to be called on initialization
		if (oldValue === newValue) return

		switch (name) {
			case 'data-transtime':
				clearInterval(this._intervallID)
				this._intervallID = setInterval(this._autoSlideIndex.bind(this), this.transtime)
				break
			default:
				console.warn('unknown attribute: ', name)
		}
	}

	connectedCallback() {

		// init public
		//this.dataset.theme ??= document.documentElement.dataset.theme
		this.dataset.transfx ??= 'slide'
		this.dataset.filter ??= 'none'
		this.dataset.transtime ??= 4
		//this.dataset.bullets ??= 'true'
		//this.dataset.controls ??= 'true'
		this.dataset.state ??= 'play'
		this.dataset.arrows ??= 'singleLeftPointingAngleQuotationMark'

		this._imgs = Array.from(this.querySelectorAll(':scope > img'))

		// init elements
		this._initElements()

		if (this.dataset.bullets === 'true') {
			this._insertBullets(this._imgs, this)
		}
		if (this.dataset.controls !== 'undefined' && this.dataset.controls !== 'false') {
			this._insertControls()
		}
	}

	_initElements() {
		if (this._imgs.length === 0) return console.error('this._imgs: ', this._imgs)

		if (this._imgs.length === 1) {
			this._imgs[this.currIndex].style.setProperty('transition', 'unset') // get rid of any transitions during the initial load
			this._imgs[this.currIndex].classList.add('show') // showcase first img
			this._imgs[this.currIndex].style.removeProperty('transition')
		}

		if (this._imgs.length > 1) {
			// if there are multiple images

			this._imgs.forEach(el => el.style.setProperty('transition', 'unset')) // this hack is necessary to get rid of any transitions during the initial load
			this._imgs[this.currIndex].classList.add('show') // showcase first img
			setTimeout(() => {
				// delay start of transfx
				if (this._log) console.log('starting setInterval... ')
				this._imgs.forEach((el) => el.style.removeProperty('transition'))
				this._intervallID = setInterval(this._autoSlideIndex.bind(this), this.transtime)

			}, 3000)
		}
	}

	_insertBullets(imgs, parent) {
		// * this._onClickBullet
		let bullets = document.createElement('div')
		bullets.className = 'bullets'
		bullets.ariaHidden = true

		imgs.map((item, index) => {
			let button = document.createElement('button')
			button.classList.add('bullet')
			button.id = `bullet-${index}`
			button.dataset.index = index
			button.addEventListener('click', this._onClickBullet)
			bullets.append(button)
		})
		this._bulletsCreated = true
		parent.append(bullets)
	}

	_insertControls() {
		let controls = document.createElement('div')
		controls.className = 'controls'
		// play
		if (this.dataset.controls === 'true' || this.dataset.controls.includes('play')) {
			let play = (new Button({ html: 'svg', svg: 'play', className: 'play' }))
			play.addEventListener('click', this._onClickPlay)
			controls.append(play)
		}
		// pause
		if (this.dataset.controls === 'true' || this.dataset.controls.includes('pause')) {
			let pause = (new Button({ html: 'svg', svg: 'pause', className: 'pause' }))
			pause.addEventListener('click', this._onClickPause)
			controls.append(pause)
		}
		// arrows
		if (this.dataset.controls.includes('arrows')) {
			
			let unicodeNameLeft = this.dataset.arrows.replace('Right', 'Left').replace('right', 'left')
			let unicodeNameRight = this.dataset.arrows.replace('Left', 'Right').replace('left', 'right')

			let left = (new Button({ html: 'unicode', unicode: unicodeNameLeft, className: 'left arrows' }))
			left.addEventListener('click', this._onClickLeft)
			controls.append(left)

			let right = (new Button({ html: 'unicode', unicode: unicodeNameRight, className: 'right arrows' }))
			right.addEventListener('click', this._onClickRight)
			controls.append(right)
		}

		this.append(controls)
	}

	_onClickPlay = (evt) => {
		this.dataset.state = 'play'
		if (this._intervallID === null) {
			this._intervallID = setInterval(this._autoSlideIndex.bind(this), this.transtime)
		}
	}

	_onClickPause = (evt) => {
		this.dataset.state = 'pause'
		clearInterval(this._intervallID)
		this._intervallID = null
	}

	_onClickPlayPause = (evt) => {
		if (this.dataset.state === 'play') {
			this.dataset.state = 'pause'
			clearInterval(this._intervallID)
		}
		else {
			this.dataset.state = 'play'
			this._intervallID = setInterval(this._autoSlideIndex.bind(this), this.transtime)
		}
	}

	_onClickBullet = (evt) => {
		this.currIndex = Number(evt.target.dataset.index)
	}

	_onClickLeft = () => {
		this.currIndex = this.currIndex - 1
	}

	_onClickRight = () => {
		this.currIndex = this.currIndex + 1
	}

	_autoSlideIndex() {
		// called by setIntervall
		// slides the img index forwards/backwards

		let oldIndex = this.currIndex
		let newIndex

		// set slide direction
		if (this.currIndex === this._imgs.length - 1) {
			this._slideReverse = true;
		}
		if (this.currIndex === 0) {
			this._slideReverse = false;
		}

		if (this._slideReverse) {
			this.currIndex = this.currIndex - 1
		} else {
			this.currIndex = this.currIndex + 1
		}
	}

	_updateClasses(oldIndex, newIndex) {
		this._imgs[oldIndex].classList.remove('show'); //
		this._imgs[newIndex].classList.add('show'); //

		if (this._bulletsCreated) {
			if (Number.isInteger(oldIndex)) this.querySelector(`#bullet-${oldIndex}`).classList.remove('bullet-current')
			if (Number.isInteger(newIndex)) this.querySelector(`#bullet-${newIndex}`).classList.add('bullet-current')
		}
	}
}