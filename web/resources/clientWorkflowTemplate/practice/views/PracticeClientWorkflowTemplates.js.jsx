/**
 * View component for /firms/:firmId/workspaces/:clientId/client-workflow-templates
 *
 * Displays a list of clientWorkflowTemplates on a left sidebar and a preview of the template on the right.
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link, Route, Switch, withRouter } from 'react-router-dom';
import classNames from 'classnames';

// import actions
import * as firmActions from '../../../firm/firmActions';
import * as clientWorkflowTemplateActions from '../../clientWorkflowTemplateActions';

// import global components
import Binder from '../../../../global/components/Binder.js.jsx';
import YTRoute from '../../../../global/components/routing/YTRoute.js.jsx';
import ClientWorkflowTemplateLayout from '../../components/ClientWorkflowTemplateLayout.js.jsx';

// import resource components
import PracticeClientWorkflowTemplateList from '../components/PracticeClientWorkflowTemplateList.js.jsx';
import PracticeClientWorkflowTemplatePreview from './PracticeClientWorkflowTemplatePreview.js.jsx';

class PracticeClientWorkflowTemplates extends Binder {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const { dispatch, history, match } = this.props;
    dispatch(clientWorkflowTemplateActions.fetchListIfNeeded('status', 'published')).then(cwtRes => {
      if(cwtRes.success) {
        const firstTemplate = cwtRes.list && cwtRes.list[0] ? cwtRes.list[0] : null
        if(firstTemplate) {
          history.push(`${match.url}/${firstTemplate._id}`)
        }
      }
    })
    dispatch(firmActions.fetchSingleIfNeeded(match.params.firmId));
  }

  render() {
    const { clientWorkflowTemplateStore, location, match} = this.props;

    /**
     * use the selected.getItem() utility to pull the actual firm object from the map
     */

    const clientWorkflowTemplateList = clientWorkflowTemplateStore.util.getList('status', 'published');

    const clientWorkflowTemplateListInfo = (
      clientWorkflowTemplateStore
      && clientWorkflowTemplateStore.lists
      && clientWorkflowTemplateStore.lists.status
      && clientWorkflowTemplateStore.lists.status.published ? clientWorkflowTemplateStore.lists.status.published : null
    );

    const isEmpty = (
      !clientWorkflowTemplateList
      || !clientWorkflowTemplateListInfo
    );

    const isFetching = (
      !clientWorkflowTemplateListInfo
      || clientWorkflowTemplateListInfo.isFetching
    );

    return (
      <ClientWorkflowTemplateLayout
        header="Template Preview"
      >
      { isEmpty ?
        (isFetching ? <h2>Loading...</h2> : <h2>Empty.</h2>)
        :
        <div style={{ opacity: isFetching ? 0.5 : 1 }}>
          <div className="template-preview-sidebar">
            <div className="tab-bar-nav">
              <div className="-sidebar-menu">
                <div className="-icon">
                  <a className="-exit-preview" href={match.url.replace('client-workflow-templates', 'client-workflows')}>
                    <p><i className="fas fa-arrow-left"></i>Back to client workflows</p>
                  </a>
                </div>
              </div>
            </div>
            <div className="-content">
              <h4>Click on a template below to see a preview</h4>
              <PracticeClientWorkflowTemplateList
                clientWorkflowTemplateList={clientWorkflowTemplateList}
                setSelectedTemplate={this._setSelectedTemplate}
              />
            </div>
          </div>
          <Switch location={location}>
            <YTRoute
              component={PracticeClientWorkflowTemplatePreview}
              exact
              path="/firm/:firmId/workspaces/:clientId/client-workflow-templates/:clientWorkflowTemplateId"
              login={true}
            />
            <Route render={() =>
              <div/>
            }/>
          </Switch>
        </div>
      }
      </ClientWorkflowTemplateLayout>
    )
  }
}

PracticeClientWorkflowTemplates.propTypes = {
  dispatch: PropTypes.func.isRequired
}

const mapStoreToProps = (store) => {
  /**
  * NOTE: Yote refer's to the global Redux 'state' as 'store' to keep it mentally
  * differentiated from the React component's internal state
  */
  return {
    clientWorkflowTemplateStore: store.clientWorkflowTemplate
  }
}

export default withRouter(
  connect(
    mapStoreToProps
  )(PracticeClientWorkflowTemplates)
);
