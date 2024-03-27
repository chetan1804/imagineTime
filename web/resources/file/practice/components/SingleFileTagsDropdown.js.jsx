import React from 'react';
import PropTypes from 'prop-types';
import Binder from '../../../../global/components/Binder.js.jsx';
import { Link, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// import third-party libraries
import _ from 'lodash';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

// global
import { TextInput } from '../../../../global/components/forms'

// utils 
import filterUtils from '../../../../global/utils/filterUtils'; 

// actions
import * as tagActions from '../../../tag/tagActions'; 
import * as fileActions from '../../fileActions'; 

class SingleFileTagsDropdown extends Binder {
  constructor(props) {
    super(props);
    this.state = {
      newTagName: ''
      , type: 'other'
    }
    this._bind(
      '_handleFormChange'
      , '_handleCreateNewTag'
      , '_removeTag'
      , '_addTag'
    )
  }

  _handleFormChange(e) {
    const { dispatch, match } = this.props; 
    let newState = _.update(_.cloneDeep(this.state), e.target.name, () => {
      return e.target.value;
    });

    dispatch(tagActions.setQuery(e.target.value.toLowerCase(), '~firm', match.params.firmId));
    this.setState({newTagName: e.target.value.toLowerCase()});
  }

  _handleCreateNewTag() {
    const { dispatch, tagStore, file, match } = this.props; 
    let newTag = _.cloneDeep(tagStore.defaultItem.obj); 
    newTag.name = this.state.newTagName; 
    newTag.type = this.state.type; 
    newTag._firm = match.params.firmId;  
    dispatch(tagActions.sendCreateTag(newTag)).then((json) => {
      if(json.success) {
        let newFile = _.cloneDeep(file); 
        newFile._tags.push(json.item._id); 
        dispatch(fileActions.sendUpdateFile(newFile)); 
        dispatch(tagActions.addTagToList(json.item._id, '~firm', match.params.firmId))
      }
    });
    this.setState({newTagName: '', type: 'other'})
    dispatch(tagActions.setQuery('', '~firm', match.params.firmId));
  }

  _removeTag(tag) {
    const { dispatch, file } = this.props; 
    let newFile = _.cloneDeep(file); 
    let newTags = newFile._tags.filter(item => item != tag._id);
    newFile._tags = newTags; 
    dispatch(fileActions.sendUpdateFile(newFile));
  }

  _addTag(tag) {
    const { dispatch, file, match } = this.props; 
    let newFile = _.cloneDeep(file); 
    if(newFile._tags.indexOf(tag._id) > -1) {
      null;
    } else {
      newFile._tags.push(tag._id); 
      dispatch(fileActions.sendUpdateFile(newFile)); 
      this.setState({newTagName: '', type: 'other'})
      dispatch(tagActions.setQuery('', '~firm', match.params.firmId));
    }
  }

  render() {
    const {
      isOpen
      , tagStore
      , match
      , fileTags
      , sortedTagListItems
      , tagNameList
      , isFirmOwner
      , cssInline
    } = this.props;
    const { newTagName } = this.state; 
    return (
        <span className="single-file-options" style={cssInline ? cssInline : {}}>
          <TransitionGroup >
            { isOpen ?
              <CSSTransition
                classNames="dropdown-anim"
                timeout={0}
              >
                <div className="dropMenu -tags-menu">
                  <div className="yt-row" style={{padding: 5}}>
                    <div>
                      { fileTags.map((tag, i) =>
                        tag.name ?
                        <span className="tag-pill" key={tag._id + '_' + i}>{tag.name} <i onClick={() => this._removeTag(tag)} style={{paddingLeft: 5}} class="fal fa-times"></i></span>
                        :
                        null
                      )}
                    </div>
                      <TextInput
                        change={this._handleFormChange}
                        name={'newTagName'}
                        value={newTagName}
                        onSubmit={isFirmOwner ? this._handleCreateNewTag : null}
                        classes={'hidden-input'}
                        autoFocus={true}
                        placeholder={"Search for a tag..."}
                      />
                  </div>
                  <p className="tag-instructions">Select a tag {isFirmOwner ? "or create one" : null}</p>
                  {newTagName.length > 0 && !tagNameList.includes(newTagName) ? 
                    <div>
                      {isFirmOwner ? 
                        <div onClick= {this._handleCreateNewTag} className="tag-list-item center-vert">
                          <p>Create '{newTagName}'</p>
                        </div>
                      : 
                        null
                      }
                    </div>
                  : null
                  }
                  { sortedTagListItems && sortedTagListItems.map((tag => 
                    <div onClick={() => this._addTag(tag)} className="tag-list-item center-vert" key={tag._id}>
                      <p>{tag.name}</p>
                    </div>
                  ))}
                </div>
              </CSSTransition>
              :
              <div>
                { fileTags.length > 2 ?
                  <div>
                    <span className="tag-pill">{fileTags[0].name}</span>
                    <span className="tag-pill">{fileTags[1].name}</span>
                    <span className="tag-pill">+ {fileTags.length - 2} more</span>
                  </div>
                : fileTags.length > 0 ?
                  <div>
                    {fileTags.map((tag, i) =>
                      tag.name ?
                      <span className="tag-pill" key={tag._id + '_' + i}>{tag.name}</span>
                      :
                      null
                    )}
                  </div>
                  : 
                  <div>
                    <span className="tag-pill add">Add tag</span>
                  </div>
                }
              </div>
            }
          </TransitionGroup>
        </span>
    )
  }
}

SingleFileTagsDropdown.propTypes = {
  isOpen: PropTypes.bool.isRequired
}

SingleFileTagsDropdown.defaultProps = {

}

const mapStoreToProps = (store) => {
  return {
    tagStore: store.tag
  }
}

export default withRouter(connect(
  mapStoreToProps
)(SingleFileTagsDropdown));