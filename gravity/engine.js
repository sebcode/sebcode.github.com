// prototype4 engine - http://p4.baunz.net/

GO = function() { }

GO.Screen = { }

GO.config = {}
GO.config.fontName = 'sans'

GO.start = function()
{
	this.Event.init()
	
	this.entityCount = 0
	this.speed = 1
	this.delta = 0
	this.counter = 0
	this.seconds = 0
	this.tick = 0
	this.tickn = 0
	this.frameCounter = 0
	this.fps = 0
	this.fpsCounter = 0
	this.fpsLastSec = 0

	this.msg = ''
	this.messages = new GO.LinkedList

	this.scenes = { }
	this.scene = false
	this.handlers = new GO.LinkedList
	
	this.canvas = document.getElementById('canvas')
	if (!this.canvas || (this.canvas && !this.canvas.getContext)) {
		return false
	}

	this.Screen.width = this.canvas.width
	this.Screen.height = this.canvas.height
	
	this.ctx = this.canvas.getContext('2d')
	this.ctx.mozImageSmoothingEnabled = false
	
	this.timer = window.setInterval(function() {
		GO.loop()
	}, 1000 / 60)

	if (this.init) {
		this.init.call(this)
	}
}

GO.setScene = function(scene)
{
	if (this.scene.deactivate) {
		this.scene.deactivate.call(this.scene)
	}

	this.scene = scene
	
	if (this.scene.activate) {
		this.scene.activate.call(this.scene)
	}
}

GO.loop = function()
{
	if (this.pause) {
		return
	}

	var date = new Date
	this.now = date.getTime()
	if (this.oldtime) {
		this.delta = ((this.now - this.oldtime) / 1000) * this.speed
	}
	this.oldtime = this.now

	this.counter += this.delta
	this.seconds = Math.round(this.counter)
	this.frameCounter++

	this.fpsCounter++
	if (this.fpsLastSec != this.seconds) {
		this.fps = this.fpsCounter * this.speed
		this.fpsCounter = 0
		this.fpsLastSec = this.seconds
	}

	this.tickn += this.delta
	if (this.tickn > 60 / 1000) {
		this.tick++
		this.tickn = 0
	}

	if (this.handlers.count) {
		this.handlers.foreach(function(handler) {
			return handler.process.call(handler)
		}, this)
	}

	if (this.scene) {
		this.scene.process.call(this.scene)
	}

	if (this.msg) {
		this.ctx.fillStyle = 'white'
		this.ctx.font = '12px ' + this.config.fontName
		this.ctx.fillText(this.msg, 20, this.Screen.height - 20)
	}

	this.showFPS()

	this.Event.frameReset()
}

GO.showFPS = function()
{
	if (!this.config.showFPS) {
		return
	}

	this.ctx.fillStyle = '#666'
	this.ctx.font = '8px ' + this.config.fontName
	this.ctx.textAlign = 'end'
	this.ctx.textBaseline = 'top'
	this.ctx.fillText(this.fps + ' fps', GO.Screen.width - 5, 5)
}

GO.showMsg = function(msg)
{
	if (!this.msg) {
		this.msg = msg
	} else {
		this.messages.push({ msg: msg })
	}

	if (this.messageTimer) {
		return
	}

	this.messageTimer = new GO.Timer(1000, function() {
		if (!GO.messages.count) {
			GO.msg = ''
			GO.messageTimer = false
			return false
		}

		var mobj = GO.messages.first
		GO.msg = mobj.msg
		GO.messages.del(mobj)
	}, this)
	
	this.handlers.push(this.messageTimer)
}


GO.LinkedList = function() { }

GO.LinkedList.prototype.first = null
GO.LinkedList.prototype.last = null
GO.LinkedList.prototype.count = 0

GO.LinkedList.prototype.destruct = function()
{
	this.clear()
}

GO.LinkedList.prototype.unshift = function(item)
{
	if (this.first) {
		this.first.llprev = item
		item.llnext = this.first
		this.first = item
	} else {
		this.first = item
		this.last = item
	}
	
	this.count++
	GO.entityCount++
	return item
}

GO.LinkedList.prototype.push = function(item)
{
	if (this.last) {
		this.last.llnext = item
		item.llprev = this.last
		this.last = item
	} else {
		this.first = item
		this.last = item
	}
	
	this.count++
	GO.entityCount++
	return item
}

GO.LinkedList.prototype.del = function(item)
{
	if (this.first == item) {
		this.first = item.llnext
	}

	if (this.last == item) {
		this.last = item.llprev
	}

	if (item.llprev) {
		if (item.llnext) {
			item.llprev.llnext = item.llnext
		} else {
			item.llprev.llnext = null
		}
	}

	if (item.llnext) {
		if (item.llprev) {
			item.llnext.llprev = item.llprev
		} else {
			item.llnext.llprev = null
		}
	}

	if (item.destruct) {
		item.destruct()
	}

	this.count--
	GO.entityCount--
	delete item
}

GO.LinkedList.prototype.get = function(i)
{
	if (!this.first) {
		return false
	}

	var item = this.first
	var index = 0

	do {
		if (index == i) {
			return item
		}

		index++
		item = item.llnext
	} while (item)

	return false
}

GO.LinkedList.prototype.clear = function()
{
	this.foreach(function() {
		return false
	})
}

GO.LinkedList.prototype.foreach = function(func, ctx)
{
	if (!ctx) {
		ctx = this
	}

	if (!this.first) {
		return
	}

	var item = this.first

	do {
		var ret = func.call(ctx, item)

		if (ret === true) {
			return
		} else if (ret === false) {
			var delitem = item
			item = item.llnext
			this.del(delitem)
		} else {
			item = item.llnext
		}
	} while (item)
}


GO.Util = {}

GO.Util.extend = function(subclass, superclass)
{
	function Dummy(){}
	Dummy.prototype = superclass.prototype
	subclass.prototype = new Dummy()
	subclass.prototype.constructor = subclass
	subclass.superclass = superclass
	subclass.superproto = superclass.prototype
}

GO.Util.createColorRGB = function(scheme)
{
	var cr = scheme.r
	var cg = scheme.g
	var cb = scheme.b

	if (cr == -1) {
		var r = Math.floor(Math.random() * 255)
	} else {
		var r = cr
	}

	if (cg == -1) {
		var g = Math.floor(Math.random() * 255)
	} else {
		var g = cg
	}

	if (cb == -1) {
		var b = Math.floor(Math.random() * 255)
	} else {
		var b = cb
	}

	return { r: r, g: g, b: b }
}

GO.Util.createColor = function(scheme)
{
	var rgb = GO.Util.createColorRGB(scheme)

	return "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")"
}


GO.Event = { }
GO.Event.Mouse = { }
GO.Event.Keyboard = { }

GO.Event.init = function()
{
	this.Mouse.x = -1
	this.Mouse.y = -1
	this.Mouse.leftDown = false

	this.frameReset()

	addEventListener('mousemove', function(e) {
		if (GO.pause) {
			return
		}

		GO.Event.Mouse.x = e.clientX - GO.canvas.offsetLeft
		GO.Event.Mouse.y = e.clientY - GO.canvas.offsetTop
	}, true)

	addEventListener('click', function(e) {
		if (!GO.pause
			&& GO.Event.Mouse.x > 0
			&& GO.Event.Mouse.y > 0
			&& GO.Event.Mouse.x < GO.Screen.width
			&& GO.Event.Mouse.y < GO.Screen.height) {

			GO.Event.Mouse.click = true
		}
	}, true)

	addEventListener('mousedown', function(e) {
		if (GO.pause) {
			return
		}

		GO.Event.Mouse.leftDown = true
	}, true)

	addEventListener('mouseup', function(e) {
		if (GO.pause) {
			return
		}

		GO.Event.Mouse.leftDown = false
	}, true)

	addEventListener('keypress', function(e) {
		if (GO.pause) {
			return
		}

		GO.Event.Keyboard.code = e.keyCode || e.charCode || 0
		GO.Event.Keyboard.chr = String.fromCharCode(GO.Event.Keyboard.code)
		GO.Event.Keyboard.chrLower = GO.Event.Keyboard.chr.toLowerCase()
	}, true)
	
	addEventListener('keydown', function(e) {
		if (GO.pause) {
			return
		}

		var c = e.keyCode || e.charCode || 0
		if (c == 27) {
			GO.Event.Keyboard.code = c
			GO.Event.Keyboard.chr = ''
			GO.Event.Keyboard.chrLower = ''
		}
	}, true)
}

GO.Event.frameReset = function()
{
	this.Mouse.frameReset()
	this.Keyboard.frameReset()
}

GO.Event.Mouse.frameReset = function()
{
	this.click = false
}

GO.Event.Keyboard.frameReset = function()
{
	this.code = 0
	this.chr = ''
	this.chrLower = ''
}


GO.Scene = function()
{
	this.layers = { }
}

GO.Scene.prototype.paused = false

GO.Scene.prototype.pause = function()
{
	this.paused = true
}

GO.Scene.prototype.resume = function()
{
	this.paused = false
}

GO.Scene.prototype.togglePause = function()
{
	this.paused = ! this.paused
}

GO.Scene.prototype.clear = function()
{
	GO.ctx.clearRect(0, 0, GO.Screen.width, GO.Screen.height)
}

GO.Scene.prototype.process = function()
{
	if (this.paused) {
		return false
	}

	for (i in this.layers) {
		if (this.layers.hasOwnProperty(i)) {
			this.layers[i].process()
		}
	}

	/* collision detection */

	var d = 0

	this.foreachEntity(function(e) {
		if (!e.collidesWith) {
			return
		}

		for (var i = 0, l = e.collidesWith.length; i < l; i += 1) {
			var entityClass = e.collidesWith[i]

			this.foreachEntity(function(e, e2, entityClass) {
				if (!entityClass) {
					return
				}

				if (e instanceof entityClass == false) {
					return
				}

				if (e.oncollision && e.checkCollision && (d = e.checkCollision(e2))) {
					e.oncollision(e2, d)

					if (e2.oncollision) {
						e2.oncollision(e, d)
					}
				}
			}, this, e, entityClass)
		}
	}, this)

	return true
}

GO.Scene.prototype.foreachEntity = function(func, ctx, arg1, arg2, arg3)
{
	for (i in this.layers) {
		if (!this.layers.hasOwnProperty(i)) {
			continue
		}

		var layer = this.layers[i]

		layer.foreach(function(e) {
			func.call(ctx, e, arg1, arg2, arg3)
		}, ctx)
	}
}


GO.Layer = function() { }

GO.Util.extend(GO.Layer, GO.LinkedList)

GO.Layer.prototype.process = function()
{
	if (!this.first) {
		return
	}

	var entity = this.first

	this.foreach(function(e) {
		if (e.dead) {
			return false
		}
		
		if (e.process) {
			if (e.process() === false) {
				return false
			}
		}

		if (GO.wireFrame) {
			GO.ctx.fillStyle = 'red'
			GO.ctx.beginPath()
			GO.ctx.arc(e.x, e.y, 3, 0, Math.PI * 2, true)
			GO.ctx.fill()
			
			GO.ctx.beginPath()
			GO.ctx.strokeStyle = 'red'
			GO.ctx.lineWidth = 3
			GO.ctx.arc(e.x, e.y, e.cr, 0, Math.PI * 2, true)
			GO.ctx.stroke()
		}
	})
}


GO.Timer = function(interval, ontick, ctx)
{
	this.interval = interval
	this.ontick = ontick
	this.ctx = ctx
	this.oldTime = GO.now
}

GO.Timer.prototype.reset = function()
{
	this.oldTime = GO.now
}

GO.Timer.prototype.process = function()
{
	if (this.pause) {
		return
	}

	if (!this.oldTime) {
		this.oldTime = GO.now
	}

	if (!this.ontick) {
		return
	}

	if (GO.now >= this.oldTime + this.interval) {
		this.oldTime = GO.now
		return this.ontick.call(this.ctx)
	}
}


GO.VisibleEntity = function() { }

GO.VisibleEntity.prototype.checkCollision = function(s)
{
	var o1 = this
	var o2 = s

	var d = Math.sqrt(Math.pow(o1.x - o2.x, 2) + Math.pow(o1.y - o2.y, 2))

	var o1cr = o1.cr ? o1.cr : 1
	var o2cr = o2.cr ? o2.cr : 1

	if ((o1cr + o2cr) >= d) {
		return d
	}

	return false
}


GO.VisibleEntityGroup = function() { }

GO.Util.extend(GO.VisibleEntityGroup, GO.LinkedList)

GO.VisibleEntityGroup.prototype.checkCollision = GO.VisibleEntity.prototype.checkCollision

GO.VisibleEntityGroup.prototype.process = function()
{
	if (!this.first) {
		return
	}

	this.foreach(function(e) {
		if (e.dead) {
			return false
		}
		
		if (e.process) {
			if (e.process() === false) {
				return false
			}
		}
	})
}


GO.Particles = function() { }

GO.Util.extend(GO.Particles, GO.VisibleEntityGroup)

GO.Particles.prototype.x = 0
GO.Particles.prototype.y = 0
GO.Particles.prototype.size = 0.1
GO.Particles.prototype.maxsize = 3
GO.Particles.prototype.gravity = 0
GO.Particles.prototype.gravityangle = false
GO.Particles.prototype.color = false
GO.Particles.prototype.lifetime = 1
GO.Particles.prototype.interval = 1

GO.Particles.prototype.explode = function(c)
{
	this.explosion = true

	for (var i = 0; i < c; i++) {
		this.createParticle()
	}
}

GO.Particles.prototype.createParticle = function()
{
	var p = new GO.Particle
	p.x = this.x
	p.y = this.y
	p.v = this.v
	if (this.vr) {
		p.v += Math.random() * this.vr
	}
	p.size = this.size
	p.maxsize = this.maxsize
	p.gravity = this.gravity
	p.gravityangle = this.gravityangle
	p.lifetime = this.lifetime
	if (this.colorscheme) {
		p.color = GO.Util.createColor(this.colorscheme)
	} else if (this.color) {
		p.color = this.color
	}
	this.push(p)
}

GO.Particles.prototype.process = function()
{
	GO.Particles.superproto.process.call(this)

	if (this.explosion) {
		if (!this.count) {
			this.dead = true
		}

		return
	}

	if (this.lastTick != GO.tick) {
		if (GO.tick % this.interval == 0) {
			this.createParticle()
			this.lastTick = GO.tick
		}
	}
}


GO.Particle = function()
{
	this.a = Math.random() * (Math.PI * 2)
	this.dir = Math.random() > 0.5
	this.v = (1 + Math.random() * 2) * 50
}

GO.Particle.prototype.x = 0
GO.Particle.prototype.y = 0
GO.Particle.prototype.size = 0.1
GO.Particle.prototype.maxsize = 3
GO.Particle.prototype.gravity = 0
GO.Particle.prototype.gravityangle = false
GO.Particle.prototype.color = 'white'
GO.Particle.prototype.lifetime = 1

GO.Particle.prototype.setColorScheme = function(scheme)
{
	this.color = GO.Util.createColor(scheme)
}

GO.Particle.prototype.process = function()
{
	this.lifetime -= GO.delta

	if (this.lifetime < 0) {
		this.size -= GO.delta * 10
	} else if (this.size <= this.maxsize) {
		this.size += GO.delta * 100
	}

	if (this.size > this.maxsize) {
		this.size = this.maxsize
	}

	if (this.size <= 0) {
		this.dead = true
		return
	}

	if (this.dir) {
		this.a += GO.delta
	} else {
		this.a -= GO.delta
	}

	this.x += Math.sin(this.a) * this.v * GO.delta
	this.y += - Math.cos(this.a) * this.v * GO.delta

	if (this.gravity && this.gravityangle !== false) {
		this.x += Math.sin(this.gravityangle) * this.gravity * GO.delta
		this.y += - Math.cos(this.gravityangle) * this.gravity * GO.delta
	}

	GO.ctx.fillStyle = this.color
	GO.ctx.beginPath()
	GO.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, true)
	GO.ctx.closePath()
	GO.ctx.fill()

	if (this.x < 0 || this.y < 0 || this.x > GO.Screen.width || this.y > GO.Screen.height) {
		this.dead = true
	}
}

