import { Controller, Get, Query, Param, Header, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SeoService } from './seo.service';
import { Response } from 'express';

@ApiTags('Public SEO & Sitemaps')
@Controller('seo/public')
export class SeoPublicController {
  constructor(private readonly seoService: SeoService) {}

  @Get('metadata')
  @ApiOperation({ summary: 'Get public page SEO metadata and JSON-LD structured data' })
  @ApiResponse({ status: 200, description: 'Public metadata returned' })
  async getPublicMetadata(
    @Query('path') path: string,
    @Query('slug') slug?: string,
  ) {
    const metadata = await this.seoService.getPublicMetadata(path, slug);
    return metadata || {};
  }

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  @Header('Cache-Control', 'public, max-age=3600, s-maxage=3600')
  @ApiOperation({ summary: 'Generate dynamic XML sitemap index for search engines' })
  async getSitemapIndex(@Res() res: Response) {
    const xml = await this.seoService.generateXmlSitemap('index');
    return res.status(HttpStatus.OK).send(xml);
  }

  @Get('sitemap-:type.xml')
  @Header('Content-Type', 'application/xml')
  @Header('Cache-Control', 'public, max-age=3600, s-maxage=3600')
  @ApiOperation({ summary: 'Generate type-specific XML sitemap (pages, properties, locations)' })
  async getTypedSitemap(@Param('type') type: string, @Res() res: Response) {
    const xml = await this.seoService.generateXmlSitemap(type);
    return res.status(HttpStatus.OK).send(xml);
  }

  @Get('robots.txt')
  @Header('Content-Type', 'text/plain')
  @Header('Cache-Control', 'public, max-age=86400, s-maxage=86400')
  @ApiOperation({ summary: 'Dynamic robots.txt configuration with sitemap references' })
  async getRobotsTxt(@Res() res: Response) {
    const text = await this.seoService.generateRobotsTxt();
    return res.status(HttpStatus.OK).send(text);
  }
}
