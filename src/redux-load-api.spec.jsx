import { expect } from 'chai';
import log from 'picolog';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import React, { Component } from 'react';
import { renderToString } from 'react-dom/server';
import { match, Route, RouterContext, createMemoryHistory } from 'react-router';
import { connect, Provider } from 'react-redux';
import { Api, link } from 'redux-apis';

import { onload, load } from './redux-load-api';


describe('@onload(fn/*(params)*/ )', () => {
	it('can be used to decorate a component with a function to be called on load', () => {
		@onload(() => {})
		class MyComponent{}
		expect(MyComponent).to.have.a.property('onload');
		expect(MyComponent.onload).to.be.a('function');
	});
	it('can be used to decorate a component wrapped by `@connect` from react-redux', () => {
		@onload(() => {})
		@connect(() => {})
		class OnLoadFirst{}
		expect(OnLoadFirst).to.have.a.property('onload');
		expect(OnLoadFirst.onload).to.be.a('function');

		@connect(() => {})
		@onload(() => {})
		class OnLoadLast{}
		expect(OnLoadLast).to.have.a.property('onload');
		expect(OnLoadLast.onload).to.be.a('function');
	});
});


describe('load(components, params)', () => {
	it('can be used to call the load functions on the given components', () => {
		let componentALoaded = false;
		@onload(() => {componentALoaded = true;})
		class ComponentA {}
		load([ComponentA]);
		expect(componentALoaded).to.equal(true);
	});
	it('captures promises and returns a promise that fulfills once loading is complete', () => {
		let componentALoaded = false;
		@onload(() => {componentALoaded = true;})
		class ComponentA {}

		let componentBLoading = false;
		let componentBLoaded = false;
		@onload(() => {
			componentBLoading = true;
			return new Promise((resolve, reject) => {
				setTimeout(() => {
					componentBLoading = false;
					componentBLoaded = true;
					resolve();
				}, 0);
			});
		})
		class ComponentB {}
		let promise = load([ComponentA, ComponentB]);
		expect(componentALoaded).to.equal(true);
		expect(componentBLoaded).to.equal(false);
		expect(componentBLoading).to.equal(true);
		promise.then(() => {
			expect(componentBLoading).to.equal(false);
			expect(componentBLoaded).to.equal(true);
		});
	});
	it('can be used for server-side rendering with react', () => {
		class MyApi extends Api {
			constructor(state = {async:'PENDING', results:[]}) {
				super(state);
				this.setHandler('PENDING', (state, action) => ({...state, async:'PENDING'}));
				this.setHandler('BUSY', (state, action) => ({...state, async:'BUSY'}));
				this.setHandler('DONE', (state, action) => ({...state, async:'DONE'}));
				this.setHandler('SET_RESULTS', (state, action) => ({...state, results:action.payload}));
				this.run = this.run.bind(this);
			}

			pending() {return this.getState().async === 'PENDING';}
			busy() {return this.getState().async === 'BUSY';}
			done() {return this.getState().async === 'DONE';}
			results() {return this.getState().results;}

			setPending() {return this.dispatch(this.createAction('PENDING')());}
			setBusy() {return this.dispatch(this.createAction('BUSY')());}
			setDone() {return this.dispatch(this.createAction('DONE')());}
			setResults(results) {return this.dispatch(this.createAction('SET_RESULTS')(results));}

			run() {return this.dispatch(() => {
				expect(this.pending()).to.equal(true);
				expect(this.busy()).to.equal(false);
				expect(this.done()).to.equal(false);
				this.setBusy();
				expect(this.pending()).to.equal(false);
				expect(this.busy()).to.equal(true);
				expect(this.done()).to.equal(false);
				return Promise.resolve(['Many', 'cool', 'products']).then((results) => {
					this.setDone();
					expect(this.pending()).to.equal(false);
					expect(this.busy()).to.equal(false);
					expect(this.done()).to.equal(true);
					this.setResults(results);
				});
			});}
		}

		const app = new MyApi();

		@onload(app.run)
		@connect(app.connector)
		class App extends Component {
		  render() {
			// 2. access data as props
			const { async, results, api } = this.props;
			return (
				<div>
					<p>{
						async === 'PENDING' ? 'Pending...' : (
						async === 'BUSY' ? 'Busy...' : results)
					}</p>
				</div>
			);
		  }
		}

		const routes = (<Route path="/" component={App}/>);
		const history = createMemoryHistory();
		const store = applyMiddleware(thunk)(createStore)(app.reducer);
		link(store, app);

		match({ routes, location: '/' }, (err, redirect, renderProps) => {
			let markup = renderToString(<Provider store={store}><RouterContext {...renderProps} /></Provider>);
			log.info('Before loading: ', markup);
			expect(markup).to.contain('Pending...');

			let loaded = load(renderProps.components, renderProps.params);
			markup = renderToString(<Provider store={store}><RouterContext {...renderProps} /></Provider>);
			log.info('During loading: ', markup);
			expect(markup).to.contain('Busy...');

			loaded.then(() => {
				markup = renderToString(<Provider store={store}><RouterContext {...renderProps} /></Provider>);
				log.info('After loading: ', markup);
				expect(markup).to.contain('Many');
				expect(markup).to.contain('cool');
				expect(markup).to.contain('products');
			});
		});
	});
});

