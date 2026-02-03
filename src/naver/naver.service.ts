import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { retry, sleep } from './utils';

@Injectable()
export class NaverService {
  private readonly NAVER_SMARTSTORE_API_BASE = 'https://smartstore.naver.com';
  private readonly PRODUCT_DETAIL_API = `${this.NAVER_SMARTSTORE_API_BASE}/i/v2/channels`;
  private readonly BENEFITS_API = `${this.NAVER_SMARTSTORE_API_BASE}/benefits/by-product`;
  private readonly DEFAULT_REFERER = `${this.NAVER_SMARTSTORE_API_BASE}/`;

  private readonly HTTP_TIMEOUT = 10000; // ms
  private readonly INITIAL_DELAY_MS = 800;
  private readonly BETWEEN_REQUEST_DELAY_MS = 500;

  private readonly CHANNEL_UID_PATTERN = /channels\/([a-zA-Z0-9_-]+)\/products\/\d+/;

  constructor(private readonly http: HttpService) {}

  private getHeaders(referer?: string): Record<string, string> {
    return {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept':
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Referer': referer ?? this.DEFAULT_REFERER,
    };
  }

  private getRandomDelay(baseDelayMs: number): number {
    return baseDelayMs + Math.random() * baseDelayMs;
  }

  private async fetchWithRetry<T>(
    url: string,
    referer?: string,
  ): Promise<T> {
    return retry(async () => {
      const response = await firstValueFrom(
        this.http.get(url, {
          headers: this.getHeaders(referer),
          timeout: this.HTTP_TIMEOUT,
        }),
      );
      return response.data as T;
    });
  }

  private extractChannelUid(html: string): string {
    const match = html.match(this.CHANNEL_UID_PATTERN);
    if (!match) {
      throw new Error('channelUid not found in HTML');
    }
    return match[1];
  }

  private extractProductId(productUrl: string): string {
    const id = productUrl.split('/').pop();
    if (!id) {
      throw new Error('Invalid product URL');
    }
    return id;
  }

  private buildProductDetailUrl(channelUid: string, productId: string): string {
    return `${this.PRODUCT_DETAIL_API}/${channelUid}/products/${productId}?withWindow=false`;
  }

  private buildBenefitsUrl(productId: string): string {
    return `${this.BENEFITS_API}?productId=${productId}`;
  }

  async scrapeProduct(productUrl: string) {
    await sleep(this.getRandomDelay(this.INITIAL_DELAY_MS));

    const html = await this.fetchWithRetry<string>(productUrl);
    const channelUid = this.extractChannelUid(html);
    const productId = this.extractProductId(productUrl);

    await sleep(this.getRandomDelay(this.BETWEEN_REQUEST_DELAY_MS));

    const productDetailUrl = this.buildProductDetailUrl(channelUid, productId);
    const product = await this.fetchWithRetry(productDetailUrl, productUrl);

    await sleep(this.getRandomDelay(this.BETWEEN_REQUEST_DELAY_MS));

    const benefitsUrl = this.buildBenefitsUrl(productId);
    const benefits = await this.fetchWithRetry(benefitsUrl, productUrl);

    return {
      channelUid,
      productId,
      product,
      benefits,
    };
  }
}
