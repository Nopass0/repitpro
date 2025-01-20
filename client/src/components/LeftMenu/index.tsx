import s from "./index.module.scss"
import * as mui from "@mui/material"
import * as MUI from "@mui/base"
import Line from "../Line"
import Search from "../../assets/search"
import { useEffect, useState } from "react"
import "./index.css"
import AddStudent from "../AddStudent"
import { useDispatch, useSelector } from "react-redux"
import { ELeftMenuPage } from "../../types"
import AddGroup from "../AddGroup"
import AddClient from "../AddClient"
import MyCabinet from "../MyCabinet"
import socket from "../../socket"
import { ExpandLess, ExpandMore } from "@mui/icons-material"
import SortByAlphaIcon from "@mui/icons-material/SortByAlpha"
import SwapVertIcon from "@mui/icons-material/SwapVert"
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn"
import Home from "../../assets/5.svg"

import Client from "../../assets/6.svg"
import Group from "../../assets/4.svg"
import CloseIcon from "@mui/icons-material/Close"
import { ContactPopover } from "@/components/contact-popover"

type ILeftMenu = {}

const MainPage = () => {
  const [search, setSearch] = useState<string>("")
  const [valueMuiSelectType, setValueMuiSelectType] = useState<number>(0)
  const [valueMuiSelectArchive, setValueMuiSelectArchive] = useState<number>(0)
  const [sortedTypeData, setSortedTypeData] = useState<number>(0)
  const [students, setStudents] = useState([])
  const [groups, setGroups] = useState([])
  const [clients, setClients] = useState([])
  const user = useSelector((state: any) => state.user)

  const token = user?.token

  const dispatch = useDispatch()
  // const [openSelect, setOpenSelect] = useState<boolean>(false)
  const [openedStudents, setOpenedStudents] = useState<number[]>([])
  const [openedGroups, setOpenedGroups] = useState<number[]>([])
  const [openedClients, setOpenedClients] = useState<number[]>([])
  const [allCards, setAllCards] = useState<Object[]>([])
  const FakeBlockLength = 8

  const handleOpenStudent = (index: number) => {
    if (openedStudents.includes(index)) {
      setOpenedStudents(openedStudents.filter((item) => item !== index))
    } else {
      setOpenedStudents([...openedStudents, index])
    }
  }
  const handelOpenGroups = (index: number) => {
    if (openedGroups.includes(index)) {
      setOpenedGroups(openedGroups.filter((item) => item !== index))
    } else {
      setOpenedGroups([...openedGroups, index])
    }
  }

  const handleOpenClients = (index: number) => {
    if (openedClients.includes(index)) {
      setOpenedClients(openedClients.filter((item) => item !== index))
    } else {
      setOpenedClients([...openedClients, index])
    }
  }

  socket.emit("getStudentList", token)
  socket.emit("getGroupList", token)
  socket.emit("getClientList", token)

  useEffect(() => {
    socket.once("getStudentList", (data: any) => {
      console.log("Students", data)
      setStudents(data)
    })
    socket.once("getGroupList", (data: any) => {
      console.log("Groups", data)
      setGroups(data)
    })
    socket.once("getClientList", (data: any) => {
      console.log("Clients", data)
      setClients(data)
    })
  }, [])

  const handleToArchive = (studentId: string, index: number, type: string) => {
    switch (type) {
      case "student":
        // Change student.isArchived to false by index in filterStudents
        const newStudents = students.map((student, i) => {
          if (i === index) {
            return {
              ...student,
              isArchived: false,
            }
          }
          return student
        })
        setStudents(newStudents)

        socket.emit("studentToArhive", {
          token: token,
          id: studentId,
          isArchived: false,
        })
        // window.location.reload()
        socket.emit("getGroupByStudentId", {
          token: token,
          studentId: studentId,
        })

        dispatch({ type: "SET_DAY_STUDENTS", payload: students })
        dispatch({ type: "SET_CURRENT_OPENED_STUDENT", payload: studentId })
        dispatch({
          type: "SET_LEFT_MENU_PAGE",
          payload: ELeftMenuPage.AddStudent,
        })
        break

      case "group":
        const newGroups = groups.map((group, i) => {
          if (i === index) {
            return {
              ...group,
              isArchived: false,
            }
          }
          return group
        })
        setGroups(newGroups)
        socket.emit("groupToArchive", {
          token: token,
          id: studentId,
          isArchived: false,
        })
        window.location.reload()
        break
      case "client":
        const newClients = clients.map((client, i) => {
          if (i === index) {
            return {
              ...client,
              isArchived: false,
            }
          }
          return client
        })
        setClients(newClients)
        socket.emit("clientToArhive", {
          token: token,
          id: studentId,
          isArchived: false,
        })
        window.location.reload()
        break
      default:
        break
    }

    const newClients = clients.map((client, i) => {
      if (i === index) {
        return {
          ...client,
          isArchived: false,
        }
      }
      return client
    })
    setClients(newClients)
  }

  const data_muiSelectType = [
    {
      label: "Все",
      value: students.length + groups.length + clients.length,
    },
    {
      label: "Ученики",
      value: students.length,
    },
    {
      label: "Группы",
      value: groups.length,
    },
    {
      label: "Заказчики",
      value: clients.length,
    },
  ]

  const [filteredStudents, setFilteredStudents] = useState([])
  const [filteredGroups, setFilteredGroups] = useState([])
  const [filteredClients, setFilteredClients] = useState([])

  useEffect(() => {
    if (valueMuiSelectArchive === 0) {
      setFilteredStudents(students)
      setFilteredGroups(groups)
      setFilteredClients(clients)
    } else if (valueMuiSelectArchive === 1) {
      const archivedStudents = students.filter((student) => student.isArchived)
      const archivedGroups = groups.filter(
        (group) => group.isArchived || group.students.some((student) => student.isArchived),
      )
      const archivedClients = clients.filter((client) => client.isArchived)
      setFilteredStudents(archivedStudents)
      setFilteredGroups(archivedGroups)
      setFilteredClients(archivedClients)
    } else {
      const archivedStudents = students.filter((student) => !student.isArchived)
      const archivedGroups = groups.filter(
        (group) => !group.isArchived || group.students.some((student) => !student.isArchived),
      )
      const archivedClients = clients.filter((client) => !client.isArchived)
      setFilteredStudents(archivedStudents)
      setFilteredGroups(archivedGroups)
      setFilteredClients(archivedClients)
    }
  }, [valueMuiSelectArchive, students, groups, clients])

  const handleSearch = (e) => {
    const searchValue = e.target.value.toLowerCase()

    const filteredStudentsList = students.filter((student) => student.nameStudent.toLowerCase().includes(searchValue))
    setFilteredStudents(filteredStudentsList)

    const filteredGroupsList = groups.filter((group) => group.groupName.toLowerCase().includes(searchValue))
    setFilteredGroups(filteredGroupsList)

    const filteredClientsList = clients.filter((client) => client.nameStudent.toLowerCase().includes(searchValue))
    setFilteredClients(filteredClientsList)
  }
  const handleOpenCard = (studentId: string) => {
    socket.emit("getGroupByStudentId", {
      token: token,
      studentId: studentId,
    })

    //SET_CURRENT_OPENED_STUDENT with studentid
    dispatch({ type: "SET_CURRENT_OPENED_STUDENT", payload: studentId })
    //SET_LEFT_MENU_PAGE
    dispatch({ type: "SET_LEFT_MENU_PAGE", payload: ELeftMenuPage.AddStudent })
  }

  const handleOpenClient = (clientId: string) => {
    console.log(clientId, "----------- handleOpenClient -----------")
    socket.emit("getClientById", {
      token: token,
      clientId: clientId,
    })
    //SET_CURRENT_OPENED_CLIENT with clientid
    dispatch({ type: "SET_CURRENT_OPENED_CLIENT", payload: clientId })
    //SET_LEFT_MENU_PAGE
    dispatch({ type: "SET_LEFT_MENU_PAGE", payload: ELeftMenuPage.AddClient })
  }

  const handleOpenGroup = (groupId: string) => {
    socket.emit("getGroupById", {
      token: token,
      groupId: groupId,
    })
    //SET_CURRENT_OPENED_GROUP with groupid
    dispatch({ type: "SET_CURRENT_OPENED_GROUP", payload: groupId })
    //SET_LEFT_MENU_PAGE
    dispatch({ type: "SET_LEFT_MENU_PAGE", payload: ELeftMenuPage.AddGroup })
  }
  const mobileLeftSelector = useSelector((state: any) => state.mobileLeft)
  console.log(mobileLeftSelector, "mobileLeftSelector")
  useEffect(() => {
    const combinedData = [
      ...filteredGroups.map((group: any) => ({ ...group, type: "group" })),
      ...filteredStudents.map((student: any) => ({
        ...student,
        type: "student",
      })),
      ...filteredClients.map((client: any) => ({ ...client, type: "client" })),
    ]

    const sortedCombinedData = [...combinedData]
    if (sortedCombinedData.length > 0) {
      sortedCombinedData.sort((a, b) => {
        const nameA = a.nameStudent || a.groupName
        const nameB = b.nameStudent || b.groupName
        console.log(nameA, nameB, "NAME")
        if (nameA === undefined || nameB === undefined) return 0

        return nameA.localeCompare(nameB)
      })
    }

    sortedTypeData === 0 ? setAllCards(combinedData) : setAllCards(sortedCombinedData)
    console.log(allCards, "allCards")
  }, [sortedTypeData, filteredGroups, filteredStudents, filteredClients])
  console.log(
    filteredStudents,
    "filteredStudents-------",
    filteredGroups,
    "filteredGroups-------",
    filteredClients,
    "filteredClients-------",
  )

  return (
    <>
      <button
        className={`${s.CloseButton} ${mobileLeftSelector ? s.mobileLeft : ""}`}
        onClick={() => {
          dispatch({ type: "SET_MOBILE_LEFT", payload: true })

          console.log(mobileLeftSelector, "mobileLeftSelector")
        }}
      >
        <CloseIcon className={s.CloseIcon} />
      </button>
      <div className={`${s.wrapper} ${mobileLeftSelector ? s.mobileLeft : ""}`}>
        <div className={s.HeaderLeftMenu}>
          <div className={s.FilterNArchive}>
            <mui.Select
              className={s.muiSelectType}
              displayEmpty
              variant={"standard"}
              value={valueMuiSelectType}
              onChange={(e: any) => {
                setValueMuiSelectType(e.target.value)
              }}
            >
              {data_muiSelectType.map((item, index) => (
                <mui.MenuItem
                  classes={{
                    root: s.muiMenuItemRoot,
                    selected: s.muiMenuItemSelected,
                  }}
                  value={index}
                  key={index}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      whiteSpace: "nowrap",
                      fontSize: "16px",
                    }}
                  >
                    <p>{`${item.label}`}</p>&nbsp;
                    <p style={{ fontWeight: "600" }}>{item.value}</p>
                  </div>
                </mui.MenuItem>
              ))}
            </mui.Select>

            <Line width="264px" className={s.Line} />

            <mui.Select
              className={s.muiSelectType}
              variant={"standard"}
              value={valueMuiSelectArchive}
              onChange={(e: any) => {
                setValueMuiSelectArchive(e.target.value)
              }}
            >
              <mui.MenuItem
                classes={{
                  root: s.muiMenuItemRoot,
                  selected: s.muiMenuItemSelected,
                }}
                value={0}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    whiteSpace: "nowrap",
                    fontSize: "16px",
                  }}
                >
                  <p>С архивом</p>
                </div>
              </mui.MenuItem>
              <mui.MenuItem
                classes={{
                  root: s.muiMenuItemRoot,
                  selected: s.muiMenuItemSelected,
                }}
                value={1}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    whiteSpace: "nowrap",
                    fontSize: "16px",
                  }}
                >
                  <p>Только архив</p>
                </div>
              </mui.MenuItem>
              <mui.MenuItem
                classes={{
                  root: s.muiMenuItemRoot,
                  selected: s.muiMenuItemSelected,
                }}
                value={2}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    whiteSpace: "nowrap",
                    fontSize: "16px",
                  }}
                >
                  <p>Без архива</p>
                </div>
              </mui.MenuItem>
            </mui.Select>
          </div>
          <div className={s.SearchInput}>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                handleSearch(e)
                setSearch(e.target.value)
              }}
              placeholder="Имя"
            />
            <div className={s.SearchIconDiv}>
              <Search className={s.SearchIcon} />
            </div>
          </div>
          <div className={s.SortData}>
            <SwapVertIcon
              style={{
                cursor: "pointer",
                color: sortedTypeData === 0 ? "#25991c" : "",
              }}
              onClick={() => setSortedTypeData(0)}
            />
            <SortByAlphaIcon
              style={{
                cursor: "pointer",
                color: sortedTypeData === 1 ? "#25991c" : "",
              }}
              onClick={() => setSortedTypeData(1)}
            />
            {/* <mui.Select
							className={s.muiSelectSort}
							variant={'standard'}
							value={sortedTypeData}
							onChange={(e: any) => {
								setSortedTypeData(e.target.value)
							}}>
							<mui.MenuItem value={0}>
								<div
									style={{
										display: 'flex',
										flexDirection: 'row',
										whiteSpace: 'nowrap',
										fontSize: '16px',
									}}>
									<p>По типу</p>
								</div>
							</mui.MenuItem>
							<mui.MenuItem value={1}>
								<div
									style={{
										display: 'flex',
										flexDirection: 'row',
										whiteSpace: 'nowrap',
										fontSize: '16px',
									}}>
									<p>По алфавиту</p>
								</div>
							</mui.MenuItem>
						</mui.Select> */}
          </div>
        </div>
        <div className={s.MainLeftMenu}>
          {allCards.map((item: any, index: number) => (
            <>
              {index === 0 && <Line className={s.LineListFirst} width="296px" />}
              {valueMuiSelectArchive === 0 ? (
                <>
                  {item.type === "group" && (valueMuiSelectType === 0 || valueMuiSelectType === 2) ? (
                    <>
                      <div
                        className={s.GroupWrapper}
                        onClick={() => {
                          console.log(item, "group")
                        }}
                      >
                        <mui.ListItemButton className={s.ListGroup} key={index} onClick={() => handelOpenGroups(index)}>
                          <div className={`${s.ListGroupWrapper} ${item.isArchived === true && s.Archive}`}>
                            <button className={s.btn} onClick={() => handleOpenGroup(item.id)}>
                              <img width="32px" height="32px" src={Group || "/placeholder.svg"} alt="Group" />
                            </button>
                            <p>{item.groupName}</p>
                            {item.isArchived && (
                              <>
                                <button onClick={() => handleToArchive(item.id, index, "group")} className={s.Icons}>
                                  <KeyboardReturnIcon />
                                </button>
                              </>
                            )}
                            <div className={s.Icons}>
                              {openedGroups.includes(index) ? (
                                <>
                                  <ExpandLess />
                                </>
                              ) : (
                                <>
                                  <ExpandMore />
                                </>
                              )}
                            </div>
                          </div>
                        </mui.ListItemButton>

                        <mui.Collapse
                          className={s.MuiCollapse}
                          in={openedGroups.includes(index)}
                          timeout="auto"
                          unmountOnExit
                        >
                          <mui.List className={s.MuiList} component="div" disablePadding>
                            {item.students.map((student: any, index: number) => (
                              <MUI.Select
                                key={index}
                                className={`${s.muiSelect}`}
                                onListboxOpenChange={() => handleOpenStudent(index)}
                                multiple
                                renderValue={(option: MUI.SelectOption<number> | null) => {
                                  if (option == null || option.value === null) {
                                    return (
                                      <>
                                        <div style={{ marginLeft: "50px" }} className={s.ListWrapper}>
                                          <button className={s.btn}>
                                            <img src={Home || "/placeholder.svg"} alt="Home" />
                                          </button>
                                          <p style={{ width: "150px" }}>{student.nameStudent}</p>
                                          <div className={s.Icons}>
                                            {openedStudents.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                          </div>
                                        </div>
                                      </>
                                    )
                                  }
                                  return (
                                    <>
                                      <div style={{ marginLeft: "50px" }} className={s.ListWrapper}>
                                        <button onClick={() => handleOpenGroup(item.id)} className={s.btn}>
                                          <img src={Home || "/placeholder.svg"} alt="Home" />
                                        </button>
                                        <p style={{ width: "150px" }}>{student.nameStudent}</p>

                                        <div className={s.Icons}>
                                          {openedStudents.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                        </div>
                                      </div>
                                    </>
                                  )
                                }}
                              >
                                <MUI.Option className={s.muiOption} value={1}>
                                  <div className={s.ListItem}>
                                    {student.phoneNumber ? (
                                      <>
                                        <b>{student.contactFace && student.contactFace}</b>
                                        <p className={s.Phone}>{student.phoneNumber}</p>

                                        <ContactPopover phoneNumber={student.phoneNumber} email={student.email} />
                                      </>
                                    ) : (
                                      <>
                                        <p className={s.NoData}>Данных нет</p>
                                      </>
                                    )}
                                  </div>
                                </MUI.Option>
                              </MUI.Select>
                            ))}
                          </mui.List>
                        </mui.Collapse>

                        <Line className={s.LineList} width="296px" />
                      </div>
                    </>
                  ) : item.type === "student" && (valueMuiSelectType === 0 || valueMuiSelectType === 1) ? (
                    <>
                      <MUI.Select
                        key={index}
                        className={s.muiSelect}
                        onListboxOpenChange={() => handleOpenStudent(index)}
                        multiple
                        renderValue={(option: MUI.SelectOption<number> | null) => {
                          if (option == null || option.value === null) {
                            return (
                              <>
                                <div
                                  onClick={() => {
                                    console.log(item, "student")
                                  }}
                                  className={`${s.ListWrapper} ${item.isArchived === true && s.Archive}`}
                                >
                                  <button className={s.btn} onClick={() => handleOpenCard(item.id)}>
                                    <img src={Home || "/placeholder.svg"} alt="Home" />
                                  </button>
                                  <p>{item.nameStudent}</p>
                                  {item.isArchived && (
                                    <>
                                      <button
                                        className={s.Icons}
                                        onClick={() => handleToArchive(item.id, index, "student")}
                                      >
                                        <KeyboardReturnIcon />
                                      </button>
                                    </>
                                  )}
                                  <div className={s.Icons}>
                                    {openedStudents.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                  </div>
                                </div>
                              </>
                            )
                          }
                          return (
                            <>
                              <div
                                onClick={() => {
                                  console.log(item, "Itemstudent")
                                }}
                                className={`${s.ListWrapper} ${item.isArchived === true && s.Archive}`}
                              >
                                <button onClick={() => handleOpenCard(item.id)} className={s.btn}>
                                  <img src={Home || "/placeholder.svg"} alt="Home" />
                                </button>
                                <p>{item.nameStudent}</p>
                                {item.isArchived && (
                                  <>
                                    <button
                                      onClick={() => handleToArchive(item.id, index, "student")}
                                      className={s.Icons}
                                    >
                                      <KeyboardReturnIcon />
                                    </button>
                                  </>
                                )}
                                <div className={s.Icons}>
                                  {openedStudents.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                </div>
                              </div>
                            </>
                          )
                        }}
                      >
                        <MUI.Option className={s.muiOption} value={1}>
                          <div className={s.ListItem}>
                            {item.phoneNumber ? (
                              <>
                                <b>{item.contactFace && item.contactFace}</b>
                                <p className={s.Phone}>{item.phoneNumber}</p>
                                <ContactPopover phoneNumber={item.phoneNumber} email={item.email} />
                              </>
                            ) : (
                              <>
                                <p className={s.NoData}>Данных нет</p>
                              </>
                            )}
                          </div>
                        </MUI.Option>
                      </MUI.Select>
                      <Line className={s.LineList} width="296px" />
                    </>
                  ) : (
                    item.type === "client" &&
                    (valueMuiSelectType === 0 || valueMuiSelectType === 3) && (
                      <>
                        <MUI.Select
                          key={index}
                          className={s.muiSelect}
                          onListboxOpenChange={() => handleOpenClients(index)}
                          multiple
                          renderValue={(option: MUI.SelectOption<number> | null) => {
                            if (option == null || option.value === null) {
                              return (
                                <>
                                  <div className={`${s.ListWrapper} ${item.isArchived === true && s.Archive}`}>
                                    <button className={s.btn} onClick={() => handleOpenClient(item.id)}>
                                      <img src={Client || "/placeholder.svg"} alt="Client" />
                                    </button>
                                    <p>{item.nameStudent}</p>
                                    {item.isArchived && (
                                      <>
                                        <button
                                          className={s.Icons}
                                          onClick={() => handleToArchive(item.id, index, "client")}
                                        >
                                          <KeyboardReturnIcon />
                                        </button>
                                      </>
                                    )}
                                    <div className={s.Icons}>
                                      {openedClients.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                    </div>
                                  </div>
                                </>
                              )
                            }
                            return (
                              <>
                                <div className={`${s.ListWrapper} ${item.isArchived === true && s.Archive}`}>
                                  <button onClick={() => handleOpenClient(item.id)} className={s.btn}>
                                    <img src={Client || "/placeholder.svg"} alt="Client" />
                                  </button>
                                  <p>{item.nameStudent}</p>
                                  {item.isArchived === true && (
                                    <>
                                      <button
                                        onClick={() => handleToArchive(item.id, index, "client")}
                                        className={s.Icons}
                                      >
                                        <KeyboardReturnIcon />
                                      </button>
                                    </>
                                  )}
                                  <div className={s.Icons}>
                                    {openedClients.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                  </div>
                                </div>
                              </>
                            )
                          }}
                        >
                          <MUI.Option className={s.muiOption} value={1}>
                            <div className={s.ListItem}>
                              {item.phoneNumber ? (
                                <>
                                  <p className={s.Phone}>{item.phoneNumber}</p>
                                  <ContactPopover phoneNumber={item.phoneNumber} email={item.email} />
                                </>
                              ) : (
                                <>
                                  <p className={s.NoData}>Данных нет</p>
                                </>
                              )}
                            </div>
                          </MUI.Option>
                        </MUI.Select>
                        <Line className={s.LineList} width="296px" />
                      </>
                    )
                  )}
                </>
              ) : valueMuiSelectArchive === 1 && item.isArchived ? (
                <>
                  {item.type === "group" && (valueMuiSelectType === 0 || valueMuiSelectType === 2) ? (
                    <>
                      <div
                        className={s.GroupWrapper}
                        onClick={() => {
                          console.log(item, "group")
                        }}
                      >
                        <mui.ListItemButton className={s.ListGroup} key={index} onClick={() => handelOpenGroups(index)}>
                          <div className={`${s.ListGroupWrapper} ${item.isArchived === true && s.Archive}`}>
                            <button className={s.btn} onClick={() => handleOpenGroup(item.id)}>
                              <img width="32px" height="32px" src={Group || "/placeholder.svg"} alt="Group" />
                            </button>
                            <p>{item.groupName}</p>
                            {item.isArchived && (
                              <>
                                <button onClick={() => handleToArchive(item.id, index, "group")} className={s.Icons}>
                                  <KeyboardReturnIcon />
                                </button>
                              </>
                            )}
                            <div className={s.Icons}>
                              {openedGroups.includes(index) ? (
                                <>
                                  <ExpandLess />
                                </>
                              ) : (
                                <>
                                  <ExpandMore />
                                </>
                              )}
                            </div>
                          </div>
                        </mui.ListItemButton>

                        <mui.Collapse
                          className={s.MuiCollapse}
                          in={openedGroups.includes(index)}
                          timeout="auto"
                          unmountOnExit
                        >
                          <mui.List className={s.MuiList} component="div" disablePadding>
                            {item.students.map((student: any, index: number) => (
                              <MUI.Select
                                key={index}
                                className={`${s.muiSelect}`}
                                onListboxOpenChange={() => handleOpenStudent(index)}
                                multiple
                                renderValue={(option: MUI.SelectOption<number> | null) => {
                                  if (option == null || option.value === null) {
                                    return (
                                      <>
                                        <div style={{ marginLeft: "50px" }} className={s.ListWrapper}>
                                          <button className={s.btn}>
                                            <img src={Home || "/placeholder.svg"} alt="Home" />
                                          </button>
                                          <p style={{ width: "150px" }}>{student.nameStudent}</p>
                                          <div className={s.Icons}>
                                            {openedStudents.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                          </div>
                                        </div>
                                      </>
                                    )
                                  }
                                  return (
                                    <>
                                      <div style={{ marginLeft: "50px" }} className={s.ListWrapper}>
                                        <button className={s.btn}>
                                          <img src={Home || "/placeholder.svg"} alt="Home" />
                                        </button>
                                        <p style={{ width: "150px" }}>{student.nameStudent}</p>

                                        <div className={s.Icons}>
                                          {openedStudents.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                        </div>
                                      </div>
                                    </>
                                  )
                                }}
                              >
                                <MUI.Option className={s.muiOption} value={1}>
                                  <div className={s.ListItem}>
                                    {student.phoneNumber ? (
                                      <>
                                        <b>{student.contactFace && student.contactFace}</b>
                                        <p className={s.Phone}>{student.phoneNumber}</p>

                                        <ContactPopover phoneNumber={student.phoneNumber} email={student.email} />
                                      </>
                                    ) : (
                                      <>
                                        <p className={s.NoData}>Данных нет</p>
                                      </>
                                    )}
                                  </div>
                                </MUI.Option>
                              </MUI.Select>
                            ))}
                          </mui.List>
                        </mui.Collapse>

                        <Line className={s.LineList} width="296px" />
                      </div>
                    </>
                  ) : item.type === "student" && (valueMuiSelectType === 0 || valueMuiSelectType === 1) ? (
                    <>
                      <MUI.Select
                        key={index}
                        className={s.muiSelect}
                        onListboxOpenChange={() => handleOpenStudent(index)}
                        multiple
                        renderValue={(option: MUI.SelectOption<number> | null) => {
                          if (option == null || option.value === null) {
                            return (
                              <>
                                <div className={`${s.ListWrapper} ${item.isArchived === true && s.Archive}`}>
                                  <button className={s.btn} onClick={() => handleOpenCard(item.id)}>
                                    <img src={Home || "/placeholder.svg"} alt="Home" />
                                  </button>
                                  <p>{item.nameStudent}</p>
                                  {item.isArchived && (
                                    <>
                                      <button
                                        className={s.Icons}
                                        onClick={() => handleToArchive(item.id, index, "student")}
                                      >
                                        <KeyboardReturnIcon />
                                      </button>
                                    </>
                                  )}
                                  <div className={s.Icons}>
                                    {openedStudents.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                  </div>
                                </div>
                              </>
                            )
                          }
                          return (
                            <>
                              <div className={`${s.ListWrapper} ${item.isArchived === true && s.Archive}`}>
                                <button onClick={() => handleOpenCard(item.id)} className={s.btn}>
                                  <img src={Home || "/placeholder.svg"} alt="Home" />
                                </button>
                                <p>{item.nameStudent}</p>
                                {item.isArchived === true && (
                                  <>
                                    <button
                                      onClick={() => handleToArchive(item.id, index, "student")}
                                      className={s.Icons}
                                    >
                                      <KeyboardReturnIcon />
                                    </button>
                                  </>
                                )}
                                <div className={s.Icons}>
                                  {openedStudents.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                </div>
                              </div>
                            </>
                          )
                        }}
                      >
                        <MUI.Option className={s.muiOption} value={1}>
                          <div className={s.ListItem}>
                            {item.phoneNumber ? (
                              <>
                                <b>{item.contactFace && item.contactFace}</b>
                                <p className={s.Phone}>{item.phoneNumber}</p>
                                <ContactPopover phoneNumber={item.phoneNumber} email={item.email} />
                              </>
                            ) : (
                              <>
                                <p className={s.NoData}>Данных нет</p>
                              </>
                            )}
                          </div>
                        </MUI.Option>
                      </MUI.Select>
                      <Line className={s.LineList} width="296px" />
                    </>
                  ) : (
                    item.type === "client" &&
                    (valueMuiSelectType === 0 || valueMuiSelectType === 3) && (
                      <>
                        <MUI.Select
                          key={index}
                          className={s.muiSelect}
                          onListboxOpenChange={() => handleOpenClients(index)}
                          multiple
                          renderValue={(option: MUI.SelectOption<number> | null) => {
                            if (option == null || option.value === null) {
                              return (
                                <>
                                  <div className={`${s.ListWrapper} ${item.isArchived === true && s.Archive}`}>
                                    <button className={s.btn} onClick={() => handleOpenClient(item.id)}>
                                      <img src={Client || "/placeholder.svg"} alt="Client" />
                                    </button>
                                    <p>{item.nameStudent}</p>
                                    {item.isArchived && (
                                      <>
                                        <button
                                          className={s.Icons}
                                          onClick={() => handleToArchive(item.id, index, "client")}
                                        >
                                          <KeyboardReturnIcon />
                                        </button>
                                      </>
                                    )}
                                    <div className={s.Icons}>
                                      {openedClients.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                    </div>
                                  </div>
                                </>
                              )
                            }
                            return (
                              <>
                                <div className={`${s.ListWrapper} ${item.isArchived === true && s.Archive}`}>
                                  <button onClick={() => handleOpenClient(item.id)} className={s.btn}>
                                    <img src={Client || "/placeholder.svg"} alt="Client" />
                                  </button>
                                  <p>{item.nameStudent}</p>
                                  {item.isArchived === true && (
                                    <>
                                      <button
                                        onClick={() => handleToArchive(item.id, index, "client")}
                                        className={s.Icons}
                                      >
                                        <KeyboardReturnIcon />
                                      </button>
                                    </>
                                  )}
                                  <div className={s.Icons}>
                                    {openedClients.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                  </div>
                                </div>
                              </>
                            )
                          }}
                        >
                          <MUI.Option className={s.muiOption} value={1}>
                            <div className={s.ListItem}>
                              {item.phoneNumber ? (
                                <>
                                  <p className={s.Phone}>{item.phoneNumber}</p>
                                  <ContactPopover phoneNumber={item.phoneNumber} email={item.email} />
                                </>
                              ) : (
                                <>
                                  <p className={s.NoData}>Данных нет</p>
                                </>
                              )}
                            </div>
                          </MUI.Option>
                        </MUI.Select>
                        <Line className={s.LineList} width="296px" />
                      </>
                    )
                  )}
                </>
              ) : valueMuiSelectArchive === 1 && item.isArchived ? (
                <>
                  {item.type === "group" && (valueMuiSelectType === 0 || valueMuiSelectType === 2) ? (
                    <>
                      <div
                        className={s.GroupWrapper}
                        onClick={() => {
                          console.log(item, "group")
                        }}
                      >
                        <mui.ListItemButton className={s.ListGroup} key={index} onClick={() => handelOpenGroups(index)}>
                          <div className={`${s.ListGroupWrapper} ${item.isArchived === true && s.Archive}`}>
                            <button className={s.btn} onClick={() => handleOpenGroup(item.id)}>
                              <img width="32px" height="32px" src={Group || "/placeholder.svg"} alt="Group" />
                            </button>
                            <p>{item.groupName}</p>
                            {item.isArchived && (
                              <>
                                <button onClick={() => handleToArchive(item.id, index, "group")} className={s.Icons}>
                                  <KeyboardReturnIcon />
                                </button>
                              </>
                            )}
                            <div className={s.Icons}>
                              {openedGroups.includes(index) ? (
                                <>
                                  <ExpandLess />
                                </>
                              ) : (
                                <>
                                  <ExpandMore />
                                </>
                              )}
                            </div>
                          </div>
                        </mui.ListItemButton>

                        <mui.Collapse
                          className={s.MuiCollapse}
                          in={openedGroups.includes(index)}
                          timeout="auto"
                          unmountOnExit
                        >
                          <mui.List className={s.MuiList} component="div" disablePadding>
                            {item.students.map((student: any, index: number) => (
                              <MUI.Select
                                key={index}
                                className={`${s.muiSelect}`}
                                onListboxOpenChange={() => handleOpenStudent(index)}
                                multiple
                                renderValue={(option: MUI.SelectOption<number> | null) => {
                                  if (option == null || option.value === null) {
                                    return (
                                      <>
                                        <div style={{ marginLeft: "50px" }} className={s.ListWrapper}>
                                          <button className={s.btn}>
                                            <img src={Home || "/placeholder.svg"} alt="Home" />
                                          </button>
                                          <p style={{ width: "150px" }}>{student.nameStudent}</p>
                                          <div className={s.Icons}>
                                            {openedStudents.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                          </div>
                                        </div>
                                      </>
                                    )
                                  }
                                  return (
                                    <>
                                      <div style={{ marginLeft: "50px" }} className={s.ListWrapper}>
                                        <button className={s.btn}>
                                          <img src={Home || "/placeholder.svg"} alt="Home" />
                                        </button>
                                        <p style={{ width: "150px" }}>{student.nameStudent}</p>

                                        <div className={s.Icons}>
                                          {openedStudents.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                        </div>
                                      </div>
                                    </>
                                  )
                                }}
                              >
                                <MUI.Option className={s.muiOption} value={1}>
                                  <div className={s.ListItem}>
                                    {student.phoneNumber ? (
                                      <>
                                        <b>{student.contactFace && student.contactFace}</b>
                                        <p className={s.Phone}>{student.phoneNumber}</p>

                                        <ContactPopover phoneNumber={student.phoneNumber} email={student.email} />
                                      </>
                                    ) : (
                                      <>
                                        <p className={s.NoData}>Данных нет</p>
                                      </>
                                    )}
                                  </div>
                                </MUI.Option>
                              </MUI.Select>
                            ))}
                          </mui.List>
                        </mui.Collapse>

                        <Line className={s.LineList} width="296px" />
                      </div>
                    </>
                  ) : item.type === "student" && (valueMuiSelectType === 0 || valueMuiSelectType === 1) ? (
                    <>
                      <MUI.Select
                        key={index}
                        className={s.muiSelect}
                        onListboxOpenChange={() => handleOpenStudent(index)}
                        multiple
                        renderValue={(option: MUI.SelectOption<number> | null) => {
                          if (option == null || option.value === null) {
                            return (
                              <>
                                <div className={`${s.ListWrapper} ${item.isArchived === true && s.Archive}`}>
                                  <button className={s.btn} onClick={() => handleOpenCard(item.id)}>
                                    <img src={Home || "/placeholder.svg"} alt="Home" />
                                  </button>
                                  <p>{item.nameStudent}</p>
                                  {item.isArchived && (
                                    <>
                                      <button
                                        className={s.Icons}
                                        onClick={() => handleToArchive(item.id, index, "student")}
                                      >
                                        <KeyboardReturnIcon />
                                      </button>
                                    </>
                                  )}
                                  <div className={s.Icons}>
                                    {openedStudents.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                  </div>
                                </div>
                              </>
                            )
                          }
                          return (
                            <>
                              <div className={`${s.ListWrapper} ${item.isArchived === true && s.Archive}`}>
                                <button onClick={() => handleOpenCard(item.id)} className={s.btn}>
                                  <img src={Home || "/placeholder.svg"} alt="Home" />
                                </button>
                                <p>{item.nameStudent}</p>
                                {item.isArchived === true && (
                                  <>
                                    <button
                                      onClick={() => handleToArchive(item.id, index, "student")}
                                      className={s.Icons}
                                    >
                                      <KeyboardReturnIcon />
                                    </button>
                                  </>
                                )}
                                <div className={s.Icons}>
                                  {openedStudents.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                </div>
                              </div>
                            </>
                          )
                        }}
                      >
                        <MUI.Option className={s.muiOption} value={1}>
                          <div className={s.ListItem}>
                            {item.phoneNumber ? (
                              <>
                                <b>{item.contactFace && item.contactFace}rtreygety45</b>
                                <p className={s.Phone}>{item.phoneNumber}</p>
                                <ContactPopover phoneNumber={item.phoneNumber} email={item.email} />
                              </>
                            ) : (
                              <>
                                <p className={s.NoData}>Данных нет</p>
                              </>
                            )}
                          </div>
                        </MUI.Option>
                      </MUI.Select>
                      <Line className={s.LineList} width="296px" />
                    </>
                  ) : (
                    item.type === "client" &&
                    (valueMuiSelectType === 0 || valueMuiSelectType === 3) && (
                      <>
                        <MUI.Select
                          key={index}
                          className={s.muiSelect}
                          onListboxOpenChange={() => handleOpenClients(index)}
                          multiple
                          renderValue={(option: MUI.SelectOption<number> | null) => {
                            if (option == null || option.value === null) {
                              return (
                                <>
                                  <div className={`${s.ListWrapper} ${item.isArchived === true && s.Archive}`}>
                                    <button className={s.btn} onClick={() => handleOpenClient(item.id)}>
                                      <img src={Client || "/placeholder.svg"} alt="Client" />
                                    </button>
                                    <p>{item.nameStudent}</p>
                                    {item.isArchived && (
                                      <>
                                        <button
                                          className={s.Icons}
                                          onClick={() => handleToArchive(item.id, index, "client")}
                                        >
                                          <KeyboardReturnIcon />
                                        </button>
                                      </>
                                    )}
                                    <div className={s.Icons}>
                                      {openedClients.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                    </div>
                                  </div>
                                </>
                              )
                            }
                            return (
                              <>
                                <div className={`${s.ListWrapper} ${item.isArchived === true && s.Archive}`}>
                                  <button onClick={() => handleOpenClient(item.id)} className={s.btn}>
                                    <img src={Client || "/placeholder.svg"} alt="Client" />
                                  </button>
                                  <p>{item.nameStudent}</p>
                                  {item.isArchived === true && (
                                    <>
                                      <button
                                        onClick={() => handleToArchive(item.id, index, "client")}
                                        className={s.Icons}
                                      >
                                        <KeyboardReturnIcon />
                                      </button>
                                    </>
                                  )}
                                  <div className={s.Icons}>
                                    {openedClients.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                  </div>
                                </div>
                              </>
                            )
                          }}
                        >
                          <MUI.Option className={s.muiOption} value={1}>
                            <div className={s.ListItem}>
                              {item.phoneNumber ? (
                                <>
                                  <p className={s.Phone}>{item.phoneNumber}</p>
                                  <ContactPopover phoneNumber={item.phoneNumber} email={item.email} />
                                </>
                              ) : (
                                <>
                                  <p className={s.NoData}>Данных нет</p>
                                </>
                              )}
                            </div>
                          </MUI.Option>
                        </MUI.Select>
                        <Line className={s.LineList} width="296px" />
                      </>
                    )
                  )}
                </>
              ) : (
                valueMuiSelectArchive === 2 &&
                !item.isArchived && (
                  <>
                    {item.type === "group" && (valueMuiSelectType === 0 || valueMuiSelectType === 2) ? (
                      <>
                        <div
                          className={s.GroupWrapper}
                          onClick={() => {
                            console.log(item, "group")
                          }}
                        >
                          <mui.ListItemButton
                            className={s.ListGroup}
                            key={index}
                            onClick={() => handelOpenGroups(index)}
                          >
                            <div className={`${s.ListGroupWrapper} ${item.isArchived === true && s.Archive}`}>
                              <button className={s.btn} onClick={() => handleOpenGroup(item.id)}>
                                <img width="32px" height="32px" src={Group || "/placeholder.svg"} alt="Group" />
                              </button>
                              <p>{item.groupName}</p>
                              {item.isArchived && (
                                <>
                                  <button onClick={() => handleToArchive(item.id, index, "group")} className={s.Icons}>
                                    <KeyboardReturnIcon />
                                  </button>
                                </>
                              )}
                              <div className={s.Icons}>
                                {openedGroups.includes(index) ? (
                                  <>
                                    <ExpandLess />
                                  </>
                                ) : (
                                  <>
                                    <ExpandMore />
                                  </>
                                )}
                              </div>
                            </div>
                          </mui.ListItemButton>

                          <mui.Collapse
                            className={s.MuiCollapse}
                            in={openedGroups.includes(index)}
                            timeout="auto"
                            unmountOnExit
                          >
                            <mui.List className={s.MuiList} component="div" disablePadding>
                              {item.students.map((student: any, index: number) => (
                                <MUI.Select
                                  key={index}
                                  className={`${s.muiSelect}`}
                                  onListboxOpenChange={() => handleOpenStudent(index)}
                                  multiple
                                  renderValue={(option: MUI.SelectOption<number> | null) => {
                                    if (option == null || option.value === null) {
                                      return (
                                        <>
                                          <div style={{ marginLeft: "50px" }} className={s.ListWrapper}>
                                            <button onClick={() => handleOpenCard(student.id)} className={s.btn}>
                                              <img src={Home || "/placeholder.svg"} alt="Home" />
                                            </button>
                                            <p style={{ width: "150px" }}>{student.nameStudent}</p>
                                            <div className={s.Icons}>
                                              {openedStudents.includes(index) ? <ExpandLess /> : <ExpandMore />}У
                                            </div>
                                          </div>
                                        </>
                                      )
                                    }
                                    return (
                                      <>
                                        <div style={{ marginLeft: "50px" }} className={s.ListWrapper}>
                                          <button onClick={() => handleOpenCard(student.id)} className={s.btn}>
                                            <img src={Home || "/placeholder.svg"} alt="Home" />
                                          </button>
                                          <p style={{ width: "150px" }}>{student.nameStudent}</p>

                                          <div className={s.Icons}>
                                            {openedStudents.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                          </div>
                                        </div>
                                      </>
                                    )
                                  }}
                                >
                                  <MUI.Option className={s.muiOption} value={1}>
                                    <div className={s.ListItem}>
                                      {student.phoneNumber ? (
                                        <>
                                          <b>{student.contactFace && student.contactFace}</b>
                                          <p className={s.Phone}>{student.phoneNumber}</p>

                                          <ContactPopover phoneNumber={student.phoneNumber} email={student.email} />
                                        </>
                                      ) : (
                                        <>
                                          <p className={s.NoData}>Данных нет</p>
                                        </>
                                      )}
                                    </div>
                                  </MUI.Option>
                                </MUI.Select>
                              ))}
                            </mui.List>
                          </mui.Collapse>

                          <Line className={s.LineList} width="296px" />
                        </div>
                      </>
                    ) : item.type === "student" && (valueMuiSelectType === 0 || valueMuiSelectType === 1) ? (
                      <>
                        <MUI.Select
                          key={index}
                          className={s.muiSelect}
                          onListboxOpenChange={() => handleOpenStudent(index)}
                          multiple
                          renderValue={(option: MUI.SelectOption<number> | null) => {
                            if (option == null || option.value === null) {
                              return (
                                <>
                                  <div className={`${s.ListWrapper} ${item.isArchived === true && s.Archive}`}>
                                    <button className={s.btn} onClick={() => handleOpenCard(item.id)}>
                                      <img src={Home || "/placeholder.svg"} alt="Home" />
                                    </button>
                                    <p>{item.nameStudent}</p>
                                    {item.isArchived && (
                                      <>
                                        <button
                                          className={s.Icons}
                                          onClick={() => handleToArchive(item.id, index, "student")}
                                        >
                                          <KeyboardReturnIcon />
                                        </button>
                                      </>
                                    )}
                                    <div className={s.Icons}>
                                      {openedStudents.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                    </div>
                                  </div>
                                </>
                              )
                            }
                            return (
                              <>
                                <div className={`${s.ListWrapper} ${item.isArchived === true && s.Archive}`}>
                                  <button onClick={() => handleOpenCard(item.id)} className={s.btn}>
                                    <img src={Home || "/placeholder.svg"} alt="Home" />
                                  </button>
                                  <p>{item.nameStudent}</p>
                                  {item.isArchived === true && (
                                    <>
                                      <button
                                        onClick={() => handleToArchive(item.id, index, "student")}
                                        className={s.Icons}
                                      >
                                        <KeyboardReturnIcon />
                                      </button>
                                    </>
                                  )}
                                  <div className={s.Icons}>
                                    {openedStudents.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                  </div>
                                </div>
                              </>
                            )
                          }}
                        >
                          <MUI.Option className={s.muiOption} value={1}>
                            <div className={s.ListItem}>
                              {item.phoneNumber ? (
                                <>
                                  <b>{item.contactFace && item.contactFace}</b>
                                  <p className={s.Phone}>{item.phoneNumber}</p>
                                  <ContactPopover phoneNumber={item.phoneNumber} email={item.email} />
                                </>
                              ) : (
                                <>
                                  <p className={s.NoData}>Данных нет</p>
                                </>
                              )}
                            </div>
                          </MUI.Option>
                        </MUI.Select>
                        <Line className={s.LineList} width="296px" />
                      </>
                    ) : (
                      item.type === "client" &&
                      (valueMuiSelectType === 0 || valueMuiSelectType === 3) && (
                        <>
                          <MUI.Select
                            key={index}
                            className={s.muiSelect}
                            onListboxOpenChange={() => handleOpenClients(index)}
                            multiple
                            renderValue={(option: MUI.SelectOption<number> | null) => {
                              if (option == null || option.value === null) {
                                return (
                                  <>
                                    <div className={`${s.ListWrapper} ${item.isArchived === true && s.Archive}`}>
                                      <button className={s.btn} onClick={() => handleOpenClient(item.id)}>
                                        <img src={Client || "/placeholder.svg"} alt="Client" />
                                      </button>
                                      <p>{item.nameStudent}</p>
                                      {item.isArchived && (
                                        <>
                                          <button
                                            className={s.Icons}
                                            onClick={() => handleToArchive(item.id, index, "client")}
                                          >
                                            <KeyboardReturnIcon />
                                          </button>
                                        </>
                                      )}
                                      <div className={s.Icons}>
                                        {openedClients.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                      </div>
                                    </div>
                                  </>
                                )
                              }
                              return (
                                <>
                                  <div className={`${s.ListWrapper} ${item.isArchived === true && s.Archive}`}>
                                    <button onClick={() => handleOpenClient(item.id)} className={s.btn}>
                                      <img src={Client || "/placeholder.svg"} alt="Client" />
                                    </button>
                                    <p>{item.nameStudent}</p>
                                    {item.isArchived === true && (
                                      <>
                                        <button
                                          onClick={() => handleToArchive(item.id, index, "client")}
                                          className={s.Icons}
                                        >
                                          <KeyboardReturnIcon />
                                        </button>
                                      </>
                                    )}
                                    <div className={s.Icons}>
                                      {openedClients.includes(index) ? <ExpandLess /> : <ExpandMore />}
                                    </div>
                                  </div>
                                </>
                              )
                            }}
                          >
                            <MUI.Option className={s.muiOption} value={1}>
                              <div className={s.ListItem}>
                                {item.phoneNumber ? (
                                  <>
                                    <p className={s.Phone}>{item.phoneNumber}</p>
                                    <ContactPopover phoneNumber={item.phoneNumber} email={item.email} />
                                  </>
                                ) : (
                                  <>
                                    <p className={s.NoData}>Данных нет</p>
                                  </>
                                )}
                              </div>
                            </MUI.Option>
                          </MUI.Select>
                          <Line className={s.LineList} width="296px" />
                        </>
                      )
                    )}
                  </>
                )
              )}
            </>
          ))}
          {Array.from({ length: 10 }).map((_, index) => (
            <>
              <div className={s.FakeBlock} key={index}></div>
              <Line className={s.LineList} width="296px" />
            </>
          ))}
        </div>
      </div>
    </>
  )
}

const LeftMenu = ({}: ILeftMenu) => {
  const Page = useSelector((state: any) => state.leftMenu)

  switch (Page) {
    case ELeftMenuPage.MainPage:
      return <MainPage />

    case ELeftMenuPage.AddStudent:
      return <AddStudent />
    case ELeftMenuPage.AddGroup:
      return <AddGroup />
    case ELeftMenuPage.AddClient:
      return <AddClient />

    case ELeftMenuPage.MyCabinet:
      return <MyCabinet />

    default:
      return <MainPage />
  }
}

export default LeftMenu
