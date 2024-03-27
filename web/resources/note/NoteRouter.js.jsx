/**
 * Set up routing for all Note views
 *
 * For an example with protected routes, refer to /product/ProductRouter.js.jsx
 */

// import primary libraries
import React from 'react';
import { Route, Switch } from 'react-router-dom';

// import global components
import Binder from '../../global/components/Binder.js.jsx';
import YTRoute from '../../global/components/routing/YTRoute.js.jsx';

// import note views
import CreateNote from './views/CreateNote.js.jsx';
import NoteList from './views/NoteList.js.jsx';
import SingleNote from './views/SingleNote.js.jsx';
import UpdateNote from './views/UpdateNote.js.jsx';

class NoteRouter extends Binder {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <YTRoute exact path="/notes" component={NoteList} />
        <YTRoute exact login={true} path="/notes/new" component={CreateNote} />
        <YTRoute exact path="/notes/:noteId" component={SingleNote}/>
        <YTRoute exact login={true} path="/notes/:noteId/update" component={UpdateNote}/>
      </Switch>
    )
  }
}

export default NoteRouter;
