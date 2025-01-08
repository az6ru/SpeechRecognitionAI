import { useState } from "react";
import { Save } from "lucide-react";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
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
}

export function ExportButton({ transcription }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const formatTextWithSpeakers = () => {
    if (transcription.speakers && transcription.speakers.length > 0) {
      return transcription.speakers
        .map(speaker => `Спикер ${speaker.speaker + 1}:\n${speaker.text}\n`)
        .join('\n');
    }
    if (transcription.paragraphs && transcription.paragraphs.length > 0) {
      return transcription.paragraphs.join('\n\n');
    }
    return transcription.transcript;
  };

  const exportAsPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF({
        orientation: "p",
        unit: "pt",
        format: "a4"
      });

      // Загружаем шрифт Times New Roman для поддержки кириллицы
      doc.setFont("times", "normal");
      doc.setFontSize(16);

      const title = "Транскрипция";
      const titleWidth = doc.getStringUnitWidth(title) * doc.getFontSize();
      const pageWidth = doc.internal.pageSize.getWidth();
      const titleX = (pageWidth - titleWidth) / 2;

      doc.text(title, titleX, 40);

      doc.setFontSize(12);
      const formattedText = formatTextWithSpeakers();
      const lines = doc.splitTextToSize(formattedText, pageWidth - 80);

      let y = 80;
      lines.forEach((line: string) => {
        if (y > doc.internal.pageSize.getHeight() - 40) {
          doc.addPage();
          y = 40;
        }
        doc.text(line, 40, y);
        y += 20;
      });

      doc.save("transcription.pdf");
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
              children: [
                new TextRun({
                  text: "Транскрипция",
                  bold: true,
                  size: 32,
                }),
              ],
            }),
            new Paragraph({
              children: [new TextRun("")],
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
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: speaker.text,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({
                children: [new TextRun("")],
              }),
            ]).flat() || [
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
      saveAs(blob, "transcription.docx");
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
      saveAs(blob, "transcription.txt");
    } catch (error) {
      console.error("Error exporting to TXT:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Save className="mr-2 h-4 w-4" />
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