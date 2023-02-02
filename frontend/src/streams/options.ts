import { BehaviorSubject, Subject } from "rxjs"

export const allIssuances$ = new BehaviorSubject([])
export const moduleData$: any = new BehaviorSubject({})

export const fetchMyOptionTokens$ = new Subject()
export const fetchAllIssuances$ = new Subject()
export const fetchOverallData$ = new Subject()
export const fetchVolumeData$ = new Subject()

export const volumeData$: any = new BehaviorSubject({})