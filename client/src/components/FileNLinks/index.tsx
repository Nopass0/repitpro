import React, { useEffect, useState, useCallback } from 'react'
import s from './index.module.scss'
import { Collapse, List, ListItemButton, ListItemText } from '@mui/material'
import Line from '../Line'
import uploadFile from '../../assets/UploadFile.svg'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import socket from '../../socket'
import { useSelector } from 'react-redux'

interface IFileNLinks {
  className?: string
  alreadyUploaded?: {
    id?: string
    name: string
    size?: number
    type: string
    isLink?: boolean
  }[]
  callback?: (file: any, name: string, size: number, type: string) => void
  typeCard?: string
  submitLinks?: (links: string[]) => void
  deleteItem?: (item: any, index: number) => void
  fileInputId?: string
}

const FileNLinks: React.FC<IFileNLinks> = ({
  className,
  alreadyUploaded,
  callback,
  typeCard = 'student',
  submitLinks,
  deleteItem,
  fileInputId,
}: IFileNLinks) => {
  const [open, setOpen] = useState<boolean>(false)
  const [items, setItems] = useState<any[]>([])
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number
    mouseY: number
  } | null>(null)

  const user = useSelector((state: any) => state.user)
  const token = user.token

  const handleClick = () => {
    setOpen(!open)
  }

  const sendDelete = useCallback((id: string) => {
    if (!id) return;
    
    socket.emit('deleteAudio', {
      token,
      id,
      type: typeCard,
    })
  }, [token, typeCard])

  const getFileLinkById = useCallback((id: string) => {
    if (!id) return;
    const baseLinkToThisSite = `${window.location.origin}`
    window.open(`${baseLinkToThisSite}/files/${id}`, '_blank')
  }, [])

  const openLocalFile = useCallback((file: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file)
    window.open(url, '')
    // Cleanup
    return () => URL.revokeObjectURL(url)
  }, [])

  const handleAddLink = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text && text.trim() !== '') {
        const newItem = { name: text.trim(), isLink: true, type: 'link' }
        setItems(prevItems => {
          const updatedItems = [...prevItems, newItem]
          updateSubmitLinks(updatedItems)
          return updatedItems
        })
      } else {
        console.warn('Clipboard is empty or contains no text')
      }
    } catch (err) {
      console.error('Failed to read clipboard contents:', err)
    } finally {
      setContextMenu(null)
    }
  }

  const updateSubmitLinks = useCallback((updatedItems: any[]) => {
    if (!submitLinks) return;

    const links = updatedItems
      .filter(item => item.isLink || !item.file)
      .map(item => item.name)
      .filter(Boolean) // Remove any null/undefined values
    
    submitLinks(links)
  }, [submitLinks])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return;

    const newFileItems = files.map((file: File) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      file: file,
      isLink: false,
    }))

    setItems(prevItems => {
      const updatedItems = [...prevItems, ...newFileItems]
      updateSubmitLinks(updatedItems)
      return updatedItems
    })

    // Call callback for each file if provided
    if (callback) {
      newFileItems.forEach(item => {
        callback(item.file, item.name, item.size, item.type)
      })
    }
  }, [callback, updateSubmitLinks])

  const handleDeleteItem = useCallback((index: number) => {
    setItems(prevItems => {
      const deletedItem = prevItems[index]
      const updatedItems = prevItems.filter((_, i) => i !== index)
      
      // Handle deletion
      if (deletedItem?.id) {
        sendDelete(deletedItem.id)
      }
      if (deleteItem) {
        deleteItem(deletedItem, index)
      }
      
      updateSubmitLinks(updatedItems)
      return updatedItems
    })
  }, [deleteItem, sendDelete, updateSubmitLinks])

  // Initialize items when alreadyUploaded changes
  useEffect(() => {
    if (alreadyUploaded?.length) {
      setItems(alreadyUploaded)
      updateSubmitLinks(alreadyUploaded)
    }
  }, [alreadyUploaded, updateSubmitLinks])

  return (
    <>
      <ListItemButton
        className={className}
        style={{ marginTop: '10px' }}
        onClick={handleClick}
        onContextMenu={(event) => {
          event.preventDefault()
          setContextMenu({ mouseX: event.clientX, mouseY: event.clientY })
        }}>
        <input
          type="file"
          id={`fileInput__${fileInputId}`}
          multiple
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <label
          htmlFor={`fileInput__${fileInputId}`}
          style={{ cursor: 'pointer' }}
          className={s.LabelForFile}
          onContextMenu={(event) => {
            event.preventDefault()
            setContextMenu({ mouseX: event.clientX, mouseY: event.clientY })
          }}>
          <img src={uploadFile} className={s.ImgForFile} alt="Upload" />
        </label>
        <ListItemText primary="Файлы/ссылки" />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>

      <Collapse in={open} timeout="auto" unmountOnExit>
        <List
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
          component="div"
          disablePadding>
          <Line width="100%" className={s.Line} />
          <div className={s.ItemList}>
            {items.length > 0 ? (
              items.map((item: any, index: number) => (
                <React.Fragment key={index}>
                  <div
                    className={s.Item}
                    onClick={() => {
                      if (item.isLink) {
                        item.name && window.open(item.name, '_blank')
                      } else if (item.id) {
                        getFileLinkById(item.id)
                      } else if (item.file) {
                        openLocalFile(item.file)
                      }
                    }}>
                    <p>
                      {item.name && item.name.length > 20
                        ? `${item.name.slice(0, 20)}...`
                        : item.name}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteItem(index)
                      }}>
                      <DeleteOutlineIcon />
                    </button>
                  </div>
                  {index !== items.length - 1 && (
                    <Line width="100%" className={s.ItemLine} />
                  )}
                </React.Fragment>
              ))
            ) : (
              <p style={{ textAlign: 'center', width: '100%' }}>
                Список файлов и ссылок пока пуст
              </p>
            )}
          </div>
        </List>
      </Collapse>

      {contextMenu && (
        <div
          style={{
            position: 'absolute',
            left: contextMenu.mouseX,
            top: contextMenu.mouseY,
            backgroundColor: 'white',
            padding: '10px',
            border: '1px solid gray',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            zIndex: 1000,
          }}>
          <p>Вставить ссылку из буфера обмена?</p>
          <button onClick={handleAddLink} style={{ marginRight: '10px' }}>
            Да
          </button>
          <button onClick={() => setContextMenu(null)}>Нет</button>
        </div>
      )}
    </>
  )
}

export default FileNLinks