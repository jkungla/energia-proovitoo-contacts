'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const when = require('when');
const client = require('./client');

const follow = require('./follow');

const root = '/api';

class App extends React.Component {

	constructor(props) {
		super(props);
        this.state = {contacts: [], attributes: [], pageSize: 10, links: {}};
        this.onCreate = this.onCreate.bind(this);
        this.onUpdate = this.onUpdate.bind(this);
        this.onDelete = this.onDelete.bind(this);
        this.onNavigate = this.onNavigate.bind(this);
	}

    loadFromServer(pageSize) {
        follow(client, root, [
            {rel: 'contacts', params: {size: pageSize}}]
        ).then(contactCollection => {
            return client({
                method: 'GET',
                path: contactCollection.entity._links.profile.href,
                headers: {'Accept': 'application/schema+json'}
            }).then(schema => {
                this.schema = schema.entity;
                this.links = contactCollection.entity._links;
                return contactCollection;
		    });
		}).then(contactCollection => {
            return contactCollection.entity._embedded.contacts.map(contact =>
                client({
                    method: 'GET',
                    path: contact._links.self.href
                })
            );
        }).then(contactPromises => {
            return when.all(contactPromises);
        }).done(contacts => {
		    this.setState({
				contacts: contacts,
				attributes: Object.keys(this.schema.properties),
				pageSize: pageSize,
				links: this.links
		    });
		});
	}

    onCreate(newContact) {
        follow(client, root, ['contacts']).then(contactCollection => {
            return client({
                method: 'POST',
                path: contactCollection.entity._links.self.href,
                entity: newContact,
                headers: {'Content-Type': 'application/json'}
            })
        }).then(response => {
            return follow(client, root, [
                {rel: 'contacts', params: {'size': this.state.pageSize}}]);
        }).done(response => {
            if (typeof response.entity._links.last != "undefined") {
                this.onNavigate(response.entity._links.last.href);
            } else {
                this.onNavigate(response.entity._links.self.href);
            }
        });
    }

    onUpdate(contact, updatedContact) {
        client({
            method: 'PUT',
            path: contact.entity._links.self.href,
            entity: updatedContact,
            headers: {
                'Content-Type': 'application/json',
                'If-Match': contact.headers.Etag
            }
        }).done(response => {
            this.loadFromServer(this.state.pageSize);
        }, response => {
            if (response.status.code === 412) {
                alert('DENIED: Unable to update ' +
                    contact.entity._links.self.href + '. Someone has allready edited it. Pleas refresh page!');
            }
        });
    }

    onDelete(contact) {
        client({method: 'DELETE', path: contact.entity._links.self.href}).done(response => {
            this.loadFromServer(this.state.pageSize);
        });
    }

    onNavigate(navUri) {
        client({
            method: 'GET',
            path: navUri
        }).then(contactCollection => {
            this.links = contactCollection.entity._links;

            return contactCollection.entity._embedded.contacts.map(contact =>
                client({
                    method: 'GET',
                    path: contact._links.self.href
                })
            );
        }).then(contactPromises => {
            return when.all(contactPromises);
        }).done(contacts => {
            this.setState({
                contacts: contacts,
                attributes: Object.keys(this.schema.properties),
                pageSize: this.state.pageSize,
                links: this.links
            });
        });
    }

	componentDidMount() {
        this.loadFromServer(this.state.pageSize);
	}

	render() {
		return (
			<div>
				<CreateDialog attributes={this.state.attributes} onCreate={this.onCreate}/>
				<ContactList contacts={this.state.contacts}
							  links={this.state.links}
							  pageSize={this.state.pageSize}
                              attributes={this.state.attributes}
							  onNavigate={this.onNavigate}
                              onUpdate={this.onUpdate}
							  onDelete={this.onDelete} />
			</div>
		)
	}
}

class CreateDialog extends React.Component {

    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();
        var newContact = {};
        this.props.attributes.forEach(attribute => {
            newContact[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        this.props.onCreate(newContact);
        this.props.attributes.forEach(attribute => {
            ReactDOM.findDOMNode(this.refs[attribute]).value = '';
        });
        window.location = "#";
    }

    render() {
        var inputs = this.props.attributes.map(attribute =>
			<p key={attribute}>
				<input type="text" placeholder={attribute} ref={attribute} className="field" />
			</p>
        );

        return (
			<div>
				<a href="#createContact">Create</a>

				<div id="createContact" className="modalDialog">
					<div>
						<a href="#" title="Close" className="close">X</a>

						<h2>Create new contact</h2>

						<form>
                            {inputs}
							<button onClick={this.handleSubmit}>Create</button>
						</form>
					</div>
				</div>
			</div>
        )
    }

}

class UpdateDialog extends React.Component {

    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();
        var updatedContact = {};
        this.props.attributes.forEach(attribute => {
            updatedContact[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
        });
        this.props.onUpdate(this.props.contact, updatedContact);
        window.location = "#";
    }

    render() {
        var inputs = this.props.attributes.map(attribute =>
            <p key={this.props.contact.entity[attribute]}>
                <input type="text" placeholder={attribute}
                       defaultValue={this.props.contact.entity[attribute]}
                       ref={attribute} className="field" />
            </p>
        );

        var dialogId = "updateContact-" + this.props.contact.entity._links.self.href;

        return (
            <div key={this.props.contact.entity._links.self.href}>
                <a href={"#" + dialogId}>Update</a>
                <div id={dialogId} className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>

                        <h2>Update an contact</h2>

                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit}>Update</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

};


class ContactList extends React.Component{

    constructor(props) {
        super(props);
        this.handleNavFirst = this.handleNavFirst.bind(this);
        this.handleNavPrev = this.handleNavPrev.bind(this);
        this.handleNavNext = this.handleNavNext.bind(this);
        this.handleNavLast = this.handleNavLast.bind(this);
        this.handleInput = this.handleInput.bind(this);
    }

    handleInput(e) {
        e.preventDefault();
        var pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;
        if (/^[0-9]+$/.test(pageSize)) {
            this.props.updatePageSize(pageSize);
        } else {
            ReactDOM.findDOMNode(this.refs.pageSize).value = pageSize.substring(0, pageSize.length - 1);
        }
    }

    handleNavFirst(e){
        e.preventDefault();
        this.props.onNavigate(this.props.links.first.href);
    }

    handleNavPrev(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.prev.href);
    }

    handleNavNext(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.next.href);
    }

    handleNavLast(e) {
        e.preventDefault();
        this.props.onNavigate(this.props.links.last.href);
    }

	render() {
		var contacts = this.props.contacts.map(contact =>
			<Contact key={contact.entity._links.self.href}
                     contact={contact}
                     attributes={this.props.attributes}
                     onUpdate={this.props.onUpdate}
                     onDelete={this.props.onDelete}/>
		);

        var navLinks = [];
        console.log(this);
        if ("first" in this.props.links) {
            navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
        }
        if ("prev" in this.props.links) {
            navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>);
        }
        if ("next" in this.props.links) {
            navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>);
        }
        if ("last" in this.props.links) {
            navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>);
        }
		return (
			<div>
				<table>
					<tbody>
						<tr>
							<th>Name</th>
							<th>Email</th>
							<th>Address</th>
                            <th></th>
                            <th></th>
						</tr>
						{contacts}
					</tbody>
				</table>
				<div>
                    {navLinks}
				</div>
			</div>
		)
	}
}

class Contact extends React.Component{

    constructor(props) {
        super(props);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleDelete() {
        this.props.onDelete(this.props.contact);
    }

	render() {
		return (
			<tr>
				<td>{this.props.contact.entity.name}</td>
				<td>{this.props.contact.entity.email}</td>
				<td>{this.props.contact.entity.address}</td>
                <td>
                    <UpdateDialog contact={this.props.contact}
                                  attributes={this.props.attributes}
                                  onUpdate={this.props.onUpdate}/>
                </td>
				<td>
					<button onClick={this.handleDelete}>Delete</button>
				</td>
			</tr>
		)
	}
}

ReactDOM.render(
	<App />,
	document.getElementById('react')
)

