const { Component, h, render } = require('preact');
const { db } = require('./firebase');

class App extends Component {
  constructor() {
    super();
    this.state = {
      timeline: [],
      formData: {}
    };
  }

  componentDidMount() {
    this.timeline = db.ref('timeline');
    this.people = db.ref('people');
    this.timelineDisplay = this.timeline.orderByChild('createdAt');

    this.timelineDisplay.on('child_added', v => {
      this.setState(Object.assign({}, this.state, {
        timeline: [v.val()].concat(this.state.timeline)
      }));
    });
    this.timelineDisplay.on('child_removed', v => {
      v = v.val();
      this.setState(Object.assign({}, this.state, {
        timeline: this.state.timeline.filter(item => item.firebaseId !== v.firebaseId)
      }));
    });
    this.people.on('value', v =>
      this.setState(Object.assign({}, this.state, { people: v.val() })));
  }

  componentWillUnmount() {
    this.timeline.off();
    this.timelineDisplay.off();
    this.people.off();
    delete this.timeline;
    delete this.people;
  }

  setForm(prop) {
    return ev => {
      this.setState(Object.assign({}, this.state, {
        formData: Object.assign({}, this.state.formData, {
          [prop]: ev.target.value
        })
      }));
    }
  }

  isFormInvalid() {
    return !this.state.formData.person ||
      !this.state.formData.number ||
      !this.state.formData.reason;
  }

  add(ev) {
    ev.preventDefault();
    const _ref = this.timeline.push();
    _ref.set(Object.assign({}, this.state.formData, {
      completed: false,
      createdAt: new Date(),
      firebaseId: _ref.key
    }));
    const { person, number } = this.state.formData;
    const people = this.state.people || {};

    people[person] = people[person] || {};
    db.ref(`people/${person}`).update({
      total: (people[person].total || 0) + parseFloat(number)
    });

    this.setState(Object.assign({}, this.state, { formData: {} }));
  }

  complete(key, name, number) {
    return () => {
      this.timeline.child(key).remove();
      db.ref(`people/${name}`).update({
        total: this.state.people[name].total - number
      });
    };
  }

  render(props, state) {
    let { people, timeline, formData } = state;
    if (props.people) {
      people = Object.assign({}, people, props.people);
    }
    if (props.timeline) {
      timeline = timeline.concat(props.timeline);
    }
    const names = Object.keys(people || {});
    return (
      <div>
        <div>
          <h1>
            Pushups
          </h1>
          <div>
            <ul>
              {
                names.map(name => (<li>{name} owes {people[name].total} pushups</li>))
              }
            </ul>
          </div>
          <h2>Add New</h2>
          <form onSubmit={this.add.bind(this)}>
            <div>
              <input
                type="text"
                value={formData.person || ''}
                onChange={this.setForm('person')}
                placeholder="Name" />
              <input
                type="number"
                value={formData.number || null}
                onChange={this.setForm('number')}
                placeholder="# Pushups" />
              <input
                type="text"
                value={formData.reason || ''}
                onChange={this.setForm('reason')}
                placeholder="Reason" />
              <button disabled={this.isFormInvalid()}>Add</button>
            </div>
          </form>
        </div>
        <div>
          <h2>Timeline</h2>
          <ul>
            {
              (timeline || []).map(item => (
                <li>
                  <span>
                    {item.person} owes {item.number} pushups for {item.reason}
                  </span>
                  <button onClick={this.complete(item.firebaseId, item.person, item.number)}>Complete</button>
                </li>
              ))
            }
          </ul>
        </div>
      </div>
    );
  }
}

module.exports = App;

if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
  const container = document.getElementById('container');
  render(<App />, container, container.lastChild);
}
