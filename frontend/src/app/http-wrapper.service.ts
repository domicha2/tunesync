import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HttpWrapperService {
  constructor(private httpClient: HttpClient) {}

  post(url: string, body: any, options?: any) {
    return this.httpClient.post(environment.url + url, body, options);
  }

  get(url: string, options?: any) {
    return this.httpClient.get(environment.url + url, options);
  }

  put(url: string, body: any, options?: any) {
    return this.httpClient.put(environment.url + url, body, options);
  }

  delete(url: string, options?: any) {
    return this.httpClient.delete(environment.url + url, options);
  }
}
