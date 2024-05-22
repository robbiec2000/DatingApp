import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Member } from '../_models/member';
import { map, of, take } from 'rxjs';
import { PaginatedResult } from '../_models/pagination';
import { UserParams } from '../_models/userParams';
import { AccountService } from './account.service';
import { User } from '../_models/user';

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  baseUrl = environment.apiUrl;
  members: Member[] = [];
  memberCache = new Map();
  paginatedResult: PaginatedResult<Member[]> = new PaginatedResult<Member[]>;
  user: User | undefined;
  userParams: UserParams | undefined;

  constructor(private http: HttpClient, private accountService: AccountService) {
    this.accountService.currentUser$.pipe(take(1)).subscribe({
      next: user => {
        if(user){
          this.userParams = new UserParams(user);
          this.user = user;
        }
      }
    })
   }

   getUserParams(){
    return this.userParams;
   }

   setUserParams(params: UserParams){
    this.userParams = params;
   }

   
   resetUserParams(){
    if(this.user){
      this.userParams = new UserParams(this.user);
      return this.userParams;
    }
    return;
  }

  private getPaginationHeaders(pageNumber: number, pageSize: number) {
    let params = new HttpParams();
    params = params.append('pageNumber', pageNumber).append('pageSize', pageSize);
    return params;
  }

  getMembers(UserParams: UserParams) {
    const key = Object.values(UserParams).join('-');
    const response = this.memberCache.get(key);
    if(response){
      return of(response);
    }


    let params = this.getPaginationHeaders(UserParams.pageNumber, UserParams.pageSize);
    params = params.append('minAge', UserParams.minAge)
      .append('maxAge', UserParams.maxAge)
      .append('gender', UserParams.gender)
      .append('orderBy', UserParams.orderBy);
    // if(this.members.length > 0){
    //   return of(this.members);
    // }
    return this.getPaginatedResult<Member[]>(this.baseUrl + 'user', params).pipe(
      map(response => {
        this.memberCache.set(key, response);
        return response;
      })
    );
  }

  getMember(username: string) {
    const member = [...this.memberCache.values()]
    .reduce((arr, element) => arr.concat(element.result), [])
    .find((member: Member) => member.username === username);
    if(member)return of(member);
    return this.http.get<Member>(this.baseUrl + 'user/' + username);
  }

  updateMember(member: Member) {
    return this.http.put(this.baseUrl + 'user', member).pipe(
      map(() => {
        const index = this.members.indexOf(member);
        this.members[index] = { ...this.members[index], ...member }
      })
    );
  }

  setMainPhoto(photoId: number) {
    return this.http.put(this.baseUrl + 'user/set-main-photo/' + photoId, {});
  }

  deletePhoto(photoId: number) {
    return this.http.delete(this.baseUrl + 'user/delete-photo/' + photoId);
  }

  addLike(username: string){
    return this.http.post(this.baseUrl + 'likes/' + username, {});
  }

  getLikes(predicate: string, pageNumber: number, pageSize: number){
    let params = this.getPaginationHeaders(pageNumber, pageSize);
    params = params.append('predicate', predicate);
    return this.getPaginatedResult<Member[]>(this.baseUrl + 'likes', params);
  }


  private getPaginatedResult<T>(url: string, params: HttpParams) {
    const paginatedResult: PaginatedResult<T> = new PaginatedResult<T>;
    return this.http.get<T>(url, { observe: 'response', params }).pipe(
      map(res => {
        if (res.body) {
          paginatedResult.result = res.body;
        }
        const pagination = res.headers.get('Pagination');
        if (pagination) {
          paginatedResult.pagination = JSON.parse(pagination);
        }
        return paginatedResult;
      })
    );
  }

}
