import React from 'react';
import RcUpload, { UploadProps as RcUploadProps } from 'rc-upload'

import UploadList from './UploadList/index'
import { FbmUploadProps, RcFile, UploadFile, UploadChangeParam } from './types'
import { file2Obj, getFileItem, updateFileList, removeFileItem } from './utils'
import { useMergedState } from '../../hooks'

const LIST_IGNORE = `__LIST_IGNORE_${Date.now()}__`;

const FbmUpload: React.FC<FbmUploadProps> = props => {
  const {
    accept,
    name,
    multiple,
    children,
    action,
    customRequest,
    fileList,
    defaultFileList,
    maxCount,
    itemRender,
    onChange,
    onRemove,
  } = props

  const [mergedFileList, setMergedFileList] = useMergedState(defaultFileList || [], {
    value: fileList,
    postState: list => list ?? [],
  });

  const upload = React.useRef<any>();

  // 自动填入uid
  React.useMemo(() => {
    const timestamp = Date.now();

    (fileList || []).forEach((file, index) => {
      if (!file.uid && !Object.isFrozen(file)) {
        file.uid = `__AUTO__${timestamp}_${index}__`;
      }
    });
  }, [fileList]);

  const mergedBeforeUpload = async (file: RcFile, fileListArgs: RcFile[]) => {
    const { beforeUpload } = props;
    let parsedFile: File | Blob | string = file;
    if (beforeUpload) {
      const result = await beforeUpload(file, fileListArgs);

      if (result === false) {
        return false;
      }

      // Hack for LIST_IGNORE, we add additional info to remove from the list
      delete (file as any)[LIST_IGNORE];
      if ((result as any) === LIST_IGNORE) {
        Object.defineProperty(file, LIST_IGNORE, {
          value: true,
          configurable: true,
        });
        return false;
      }

      if (typeof result === 'object' && result) {
        parsedFile = result as File;
      }
    }

    return parsedFile as RcFile;
  };

  const onInternalChange = (
    file: UploadFile,
    changedFileList: UploadFile[],
    event?: { percent: number },
  ) => {
    let cloneList = [...changedFileList];

    // Cut to match count
    if (maxCount === 1) {
      cloneList = cloneList.slice(-1);
    } else if (maxCount) {
      cloneList = cloneList.slice(0, maxCount);
    }

    setMergedFileList(cloneList);

    const changeInfo: UploadChangeParam<UploadFile> = {
      file: file as UploadFile,
      fileList: cloneList,
    };

    if (event) {
      changeInfo.event = event;
    }

    onChange?.(changeInfo);
  };

  const onBatchStart: RcUploadProps['onBatchStart'] = batchFileInfoList => {
    // Skip file which marked as `LIST_IGNORE`, these file will not add to file list
    const filteredFileInfoList = batchFileInfoList.filter(info => !(info.file as any)[LIST_IGNORE]);

    // Nothing to do since no file need upload
    if (!filteredFileInfoList.length) {
      return;
    }

    const objectFileList = filteredFileInfoList.map(info => file2Obj(info.file as RcFile));

    // Concat new files with prev files
    let newFileList = [...mergedFileList];

    objectFileList.forEach(fileObj => {
      // Replace file if exist
      newFileList = updateFileList(fileObj, newFileList);
    });

    objectFileList.forEach((fileObj, index) => {
      // Repeat trigger `onChange` event for compatible
      let triggerFileObj: UploadFile = fileObj;

      if (!filteredFileInfoList[index].parsedFile) {
        // `beforeUpload` return false
        const { originFileObj } = fileObj;
        let clone;

        try {
          clone = new File([originFileObj], originFileObj.name, {
            type: originFileObj.type,
          }) as any as UploadFile;
        } catch (e) {
          clone = new Blob([originFileObj], {
            type: originFileObj.type,
          }) as any as UploadFile;
          clone.name = originFileObj.name;
          clone.lastModifiedDate = new Date();
          clone.lastModified = new Date().getTime();
        }

        clone.uid = fileObj.uid;
        triggerFileObj = clone;
      } else {
        // Inject `uploading` status
        fileObj.status = 'uploading';
      }

      onInternalChange(triggerFileObj, newFileList);
    });
  };

  const onSuccess = (response: any, file: RcFile, xhr: any) => {
    try {
      if (typeof response === 'string') {
        response = JSON.parse(response);
      }
    } catch (e) {
      /* do nothing */
    }

    // removed
    if (!getFileItem(file, mergedFileList)) {
      return;
    }

    const targetItem = file2Obj(file);
    targetItem.status = 'done';
    targetItem.percent = 100;
    targetItem.response = response;
    targetItem.xhr = xhr;

    const nextFileList = updateFileList(targetItem, mergedFileList);

    onInternalChange(targetItem, nextFileList);
  };

  const onError = (error: Error, response: any, file: RcFile) => {
    // removed
    if (!getFileItem(file, mergedFileList)) {
      return;
    }

    const targetItem = file2Obj(file);
    targetItem.error = error;
    targetItem.response = response;
    targetItem.status = 'error';

    const nextFileList = updateFileList(targetItem, mergedFileList);

    onInternalChange(targetItem, nextFileList);
  };

  const onProgress = (e: { percent: number }, file: RcFile) => {
    // removed
    if (!getFileItem(file, mergedFileList)) {
      return;
    }

    const targetItem = file2Obj(file);
    targetItem.status = 'uploading';
    targetItem.percent = e.percent;

    const nextFileList = updateFileList(targetItem, mergedFileList);

    onInternalChange(targetItem, nextFileList, e);
  };

  const handleRemove = (file: UploadFile) => {
    let currentFile: UploadFile;
    Promise.resolve(typeof onRemove === 'function' ? onRemove(file) : onRemove).then(ret => {
      // Prevent removing file
      if (ret === false) {
        return;
      }

      const removedFileList = removeFileItem(file, mergedFileList);

      if (removedFileList) {
        currentFile = { ...file, status: 'removed' };
        mergedFileList?.forEach(item => {
          const matchKey = currentFile.uid !== undefined ? 'uid' : 'name';
          if (item[matchKey] === currentFile[matchKey] && !Object.isFrozen(item)) {
            item.status = 'removed';
          }
        });
        upload.current?.abort(currentFile);

        onInternalChange(currentFile, removedFileList);
      }
    });
  };

  const handleRefresh = (file: UploadFile) => {
    const uploadFiles = upload?.current?.uploader?.uploadFiles
    if (!uploadFiles || typeof uploadFiles !== 'function') {
      return console.warn('uploadFiles方法不存在')
    }

    uploadFiles([file])
  }

  const uploadButton = (
    <RcUpload
      ref={upload}
      name={name}
      accept={accept}
      action={action}
      multiple={multiple}
      customRequest={customRequest}
      beforeUpload={mergedBeforeUpload}
      onBatchStart={onBatchStart}
      onSuccess={onSuccess}
      onError={onError}
      onProgress={onProgress}
    >
      {children}
    </RcUpload>
  )

  const uploadList = (
    <UploadList
      items={mergedFileList}
      onRemove={handleRemove}
      onRefresh={handleRefresh}
      itemRender={itemRender}
    />
  )

  return (
    <div>
      {uploadButton}
      {uploadList}
    </div>
  )
}

FbmUpload.defaultProps = {
  multiple: false,
  action: '',
  data: {},
  accept: '',
};

export default FbmUpload