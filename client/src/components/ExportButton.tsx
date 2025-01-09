import { useState } from "react";
import { Save } from "lucide-react";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { TranscriptionResponse } from "@/lib/types";

interface ExportButtonProps {
  transcription: TranscriptionResponse;
  title: string;
  activeTab: string;
}

export function ExportButton({ transcription, title, activeTab }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const formatTextWithSpeakers = () => {
    switch (activeTab) {
      case "formatted":
        return transcription.paragraphs?.join('\n\n') || transcription.transcript;
      case "speakers":
        return transcription.speakers
          ?.map(speaker => `Спикер ${speaker.speaker + 1}:\n${speaker.text}`)
          .join('\n\n');
      default:
        return transcription.transcript;
    }
  };

  const exportAsPDF = async () => {
    setIsExporting(true);
    try {
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body { 
              font-family: 'Inter', Arial, sans-serif; 
              padding: 15px;
              font-size: 10px;
              line-height: 1.2;
            }
            h1 { 
              font-size: 16px; 
              text-align: center; 
              margin-bottom: 15px;
              font-weight: bold;
            }
            .title {
              font-size: 14px;
              margin-bottom: 12px;
              font-weight: 500;
            }
            .speaker { 
              margin-bottom: 8px;
              page-break-inside: avoid;
            }
            .speaker-header { 
              font-weight: bold; 
              margin-bottom: 4px;
              font-size: 11px;
            }
            .speaker-text { 
              margin-left: 8px;
              line-height: 1.2;
            }
            .paragraph { 
              margin-bottom: 6px;
              line-height: 1.2;
            }
          </style>
        </head>
        <body>
          <h1>Результат транскрипции</h1>
          <div class="title">${title}</div>
      `;

      if (transcription.speakers && transcription.speakers.length > 0) {
        htmlContent += transcription.speakers.map(speaker => `
          <div class="speaker">
            <div class="speaker-header">Спикер ${speaker.speaker + 1}:</div>
            <div class="speaker-text">${speaker.text}</div>
          </div>
        `).join('');
      } else if (transcription.paragraphs && transcription.paragraphs.length > 0) {
        htmlContent += transcription.paragraphs.map(paragraph => `
          <div class="paragraph">${paragraph}</div>
        `).join('');
      } else {
        htmlContent += `<div class="paragraph">${transcription.transcript}</div>`;
      }

      htmlContent += `
        </body>
        </html>
      `;

      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ html: htmlContent }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      saveAs(blob, `${title}.pdf`);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsDocx = async () => {
    setIsExporting(true);
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "Результат транскрипции",
              heading: HeadingLevel.HEADING_1,
              spacing: {
                after: 400,
                line: 360,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: title,
                  size: 28,
                  bold: true,
                }),
              ],
              spacing: {
                before: 200,
                after: 400,
              },
            }),
            ...(transcription.speakers?.map((speaker) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Спикер ${speaker.speaker + 1}:`,
                    bold: true,
                    size: 24,
                  }),
                ],
                spacing: {
                  before: 400,
                  after: 200,
                },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: speaker.text,
                    size: 24,
                  }),
                ],
                spacing: {
                  after: 300,
                },
              }),
            ]).flat() || transcription.paragraphs?.map((para) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: para,
                    size: 24,
                  }),
                ],
                spacing: {
                  before: 200,
                  after: 200,
                },
              })
            ) || [
              new Paragraph({
                children: [
                  new TextRun({
                    text: transcription.transcript,
                    size: 24,
                  }),
                ],
              }),
            ]),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${title}.docx`);
    } catch (error) {
      console.error("Error exporting to DOCX:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsTxt = () => {
    setIsExporting(true);
    try {
      const formattedText = formatTextWithSpeakers();
      const blob = new Blob([formattedText], { type: "text/plain;charset=utf-8" });
      saveAs(blob, `${title}.txt`);
    } catch (error) {
      console.error("Error exporting to TXT:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Экспорт
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportAsPDF} disabled={isExporting}>
          Сохранить как PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsDocx} disabled={isExporting}>
          Сохранить как DOCX
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsTxt} disabled={isExporting}>
          Сохранить как TXT
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}