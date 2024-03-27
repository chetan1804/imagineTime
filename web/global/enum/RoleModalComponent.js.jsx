import React from 'react';

const DefautComponent = () => <div></div>
import ShareMultipleFilesModal from '../../resources/shareLink/practice/components/ShareMultipleFilesModal.js.jsx';
import ShareRequestFilesModal from '../../resources/shareLink/practice/components/ShareRequestFilesModal.js.jsx';
import CreateQuickTaskModal from '../../resources/quickTask/practice/components/CreateQuickTaskModal.js.jsx';
import UploadFilesModal from '../../resources/file/components/UploadFilesModal.js.jsx';
import CreateFolderModal from '../../resources/file/components/CreateFolderModal.js.jsx';
import FolderTemplateApplyForm from '../../resources/folderTemplate/practice/components/FolderTemplateApplyForm.js.jsx';
import ClientNotificationToggleForm from '../../resources/client/practice/components/ClientNotificationToggleForm.js.jsx';
import CreateStaffClientModal from '../../resources/staffClient/components/CreateStaffClientModal.js.jsx';
import FileMoveModal from '../../resources/file/components/FileMoveModal.js.jsx';
import AttachFilesModal from '../../resources/file/components/AttachFilesModal.js.jsx';
import RequestListForm from '../../resources/request/components/RequestListForm.js.jsx';
import RequestTaskForm from '../../resources/requestTask/components/RequestTaskForm.js.jsx';
import RequestTaskChangesForm from '../../resources/requestTask/components/RequestTaskChangesForm.js.jsx';
import AttachStaffListModal from '../../resources/staff/components/AttachStaffListModal.js.jsx';
import FileVersionListModal from '../../resources/file/components/FileVersionListModal.js.jsx';
import UploadTemplateModal from '../../resources/documentTemplate/components/UploadTemplateModal.js.jsx';
import CreateDocumentTemplateForm from '../../resources/documentTemplate/components/CreateDocumentTemplateForm.js.jsx';
import DocumentTemplateApplyForm from '../../resources/documentTemplate/components/DocumentTemplateApplyForm.js.jsx';
import StaffClientNotificationToggleForm from '../../resources/staffClient/practice/components/StaffClientNotificationToggleForm.js.jsx';
import FolderPermission from '../../resources/folderPermission/components/folderPemissionModal.js.jsx';
import RequestListApplyForm from '../../resources/request/components/RequestListApplyForm.js.jsx';

const RoleModalComponent = {
    null: DefautComponent
    , file_folder_template_apply: FolderTemplateApplyForm
    , file_move_file: FileMoveModal
    , file_share_file: ShareMultipleFilesModal
    , file_request_file: ShareRequestFilesModal
    , file_signature: CreateQuickTaskModal
    , file_upload: UploadFilesModal
    , file_create_folder: CreateFolderModal
    , file_attach: AttachFilesModal
    , file_version: FileVersionListModal    
    , client_notification: ClientNotificationToggleForm
    , client_new_staff_client: AttachStaffListModal
    , request_list: RequestListForm
    , request_task_list: RequestTaskForm
    , request_task_change: RequestTaskChangesForm
    , template_upload: UploadTemplateModal
    , document_editor: CreateDocumentTemplateForm
    , document_template_upload: UploadTemplateModal
    , document_template_apply: DocumentTemplateApplyForm
    , client_staff_notification: StaffClientNotificationToggleForm
    , folder_permission: FolderPermission
    , request_list_apply: RequestListApplyForm
}

export default RoleModalComponent;