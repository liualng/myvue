class Vue {
  constructor(options) {
    // 1.保存数据
    this.$options = options;
    this.$data = options.data;
    this.$el = oprions.el;

    // 2.将data添加响应式系统
    new Observer(this.$data)

    // 3.代理this.$data的数据
    Object.keys(this.$data).forEach(key => {
      this._proxy(key)
    })

    // 4.处理$el
    new Compiler(this.$el, this)
  }
  // 代理this.$data的数据 代理到Vue实例
  _proxy(key) {
    Object.defineProperty(this, key, {
      configurable: true,
      enumerable: true,
      set() {
        this.$data[key] = newValue;
      },
      get() {
        // 触发Observer.data的属性的代理getter
        return this.$data[key];
      }
    })
  }
}

// 观察者类(监听所有的data属性)
class Observer {
  constructor(data) {
    this.data = data;
    Object.keys(data).forEach(key => {
      this.defineReactive(this.data, key, data[key]);
    })
  }
  // 定义属性
  defineReactive(data, key, val) {
    // 一个属性key 对应 一个Dep对象(存放Watcher)
    const dep = new Dep()
    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: true,
      // 闭包特性 保存val
      get() {
        // 把被通知者加入数组
        if (Dep.target) {
          dep.addSub(Dep.target)
        }
        return val;
      },
      set(newValue) {
        // 和原值相等,不做任何处理
        if (newValue === val) {
          return
        }
        val = newValue;
        // 通知所有被观察者修改数据
        dep.notify();
      }
    })
  }
}

class Dep {
  constructor() {
    this.subs = []
  }
  addSub(sub) {
    this.subs.push(sub)
  }
  notify() {
    this.subs.forEach(sub => {
      sub.update()
    })
  }
}

class Watecher {
  constructor(node, name, vm) {
    this.node = node
    this.name = name
    this.vm = vm
    // 把自己添加到Dep.target方便添加到Dep实例的subs数组
    Dep.target = this;
    this.update()
    // 只有被创建时才加入,后面数值的更新则不用加入
    // 添加完毕后删除目标值(防止二次加入到sub数组中)
    Dep.target = null
  }

  update() {
    // 设置节点显示的值 {{value}}  触发代理的getter
    this.node.nodeValue = this.vm[this.name]
  }
}
/*
 *   .匹配任意字符(除了一些特殊符号)
    * 0或多个
    + 1或多个 
    {}在正则中有特殊含义
 */
// 匹配{{}}语法
const reg = /\{\{(.+)\}\}/
// 解析$el中的标签的{{}}
class Compiler {
  // vm  ： vue实例
  constructor(el, vm) {
    // 查找需要解析的标签
    this.el = document.querySelector(el)
    this.vm = vm

    this.frag = this._createFragment()
    // 解析完毕后添加回dom
    this.el.appendChild(this.frag)
  }

  _createFragment() {
    const frag = document.createDocumentFragment()

    let child;
    // 此操作会从dom中移除对应的标签
    while (child = this.el.firstChild) {
      this._compile(child) //解析node节点
      frag.appendChild(child)
      console.log(this.el);
    }
    return frag;
  }
  // 解析节点
  _compile(node) {
    if (node.nodeType === 1) { //是一个标签节点
      const attrs = node.attributes
      if (attrs.hasOwnProperty('v-model')) {
        const name = attrs['v-model'].nodeValue;
        //有v-model属性则绑定一个input事件
        node.addEventListener('input', e => {
          this.vm[name] = e.target.value
        })
      }
    }
    if (node.nodeType === 3) { //文本节点
      console.log(reg.test(node.nodeValue))
      if (reg.test(node.nodeValue)) {
        // 取到匹配的变量名
        const name = RegExp.$1.trim()
        console.log(name);
        // 根据名字创建Watcher
        new Watecher(node, name, this.vm)
      }
    }
  }
}