(function(w){
  function init() {
    let vm = new Vue({
      el: '#app',
      data: {
        msg: 'hello',
        obj: {
          count: 0
        }
      },
      methods: {
        add () {
          this.$data.obj.count++
        }
      },
    })
    // document.getElementById('btn').onclick = function () {
    //   vm.$data.obj.count++
    // }
  }
  function isObject (data) {
    return data && typeof data === 'object'
  }
  function optionData (data, keys, val) {
    if (!data ||!keys) return
    keys = Array.isArray(keys)? keys: keys.split('.')
    let key = keys.shift()
    return keys.length? optionData(data[key], keys, val): (val === undefined)? data[key]: data[key] = val
  }
  class Vue {
    constructor (option) {
      this.$data = option.data
      this.$el = option.el
      this.$methods = option.methods
      this.init()
    }
    init() {
      // 对data进行绑定
      this.observers(this.$data)
      // 对el进行编译，并将对应的指令转换成watcher
      let element = document.querySelector(this.$el)
      this.compailer(element)
    }
    observers (data) {
      if(!data) return
      Object.keys(data).forEach(key => {
        if (isObject(data[key])) this.observers(data[key])
        else this.observe(data, key, data[key])
      })
    }
    observe(data, key, val) {
      let dep = new Dep()
      Object.defineProperty(data, key, {
        get () {
          // 获取订阅者实例，并将watcher添加到订阅者队列中
          if (Dep.target) dep.push(Dep.target)
          return val
        },
        set (newVal) {
          // 触发订阅者update方法更新视图
          if (newVal === val) return
          val = newVal
          dep.update()
          return newVal
        }
      })
    }
    compailer(ele) {
      if (!ele) return
      if (ele.nodeType == '1') {
        let reg = /\@(.*)/
        let attrs = ele.getAttributeNames()
        attrs.forEach(attr => {
          if (attr === 'v-model') {
            let key = ele.getAttribute(attr)
            // 将当前DOM元素数据化为watcher，并通过触发对应值的get方法，保存到watcher队列中
            new Watcher(ele, key, this)
            // 如果当前元素为input，还需要监听input事件
            if (ele.tagName === 'INPUT') {
              ele.addEventListener('input', e => {
                optionData(this.$data, key, e.target.value)
                // this.$data[key] = e.target.value
              })
            }
            ele.removeAttribute(attr)
          } else if (reg.test(attr)) {
            let eventName = RegExp.$1
            let funcName = ele.getAttribute(attr)
            ele.addEventListener(eventName, (e) => {
              this.$methods[funcName].call(this, e)
            })
          }
        })
        if (ele.childNodes) {
          [...ele.childNodes].forEach(child => {
            this.compailer(child)
          })
        }
      } else if (ele.nodeType == '3') {
        let reg = /\{\{(.*)\}\}/
        if (reg.test(ele.textContent)) {
          let key = RegExp.$1
          new Watcher(ele, key, this)
        }
      }
    }
  }
  class Dep {
    constructor () {
      this.queue = []
    }
    push(data) {
      this.queue.push(data)
    }
    update () {
      this.queue.forEach(watch => watch.update())
    }
  }
  class Watcher {
    constructor (node, key, vm) {
      Dep.target = this
      this.node = node
      this.key = key
      this.vm = vm
      this.update()
      Dep.target = null
    }
    update () {
      if (this.node.nodeName === 'INPUT') {
        // this.node.value = this.vm.$data[this.key]
        this.node.value = optionData(this.vm.$data, this.key)
      } else {
        this.node.textContent = optionData(this.vm.$data, this.key)
      }
    }
  }
  w.onload = init
})(window)