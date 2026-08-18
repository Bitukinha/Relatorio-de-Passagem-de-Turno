import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ESCALA,
  formatarData,
  formatarNumero,
  tempoParado,
  totalMeta,
  totalProduzido,
  type ShiftReport,
} from "./shift";

const MARGIN = 14;

export function gerarPdf(r: ShiftReport) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  let y = MARGIN;

  doc.setFillColor(30, 90, 54);
  doc.rect(0, 0, width, 26, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("RELATORIO DE PASSAGEM DE TURNO", MARGIN, 13);
  doc.setFontSize(9);
  doc.setTextColor(220, 226, 234);
  doc.setFont("helvetica", "normal");
  doc.text(`Turno ${r.turno} | ${r.hora_inicio} as ${r.hora_fim} | ${ESCALA}`, MARGIN, 20);
  doc.text(formatarData(r.data), width - MARGIN, 20, { align: "right" });
  y = 34;

  doc.setTextColor(20, 20, 20);

  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [30, 90, 54], textColor: 255 },
    head: [["Data", "Turno", "Horario", "Responsavel", "Setor / Linha"]],
    body: [
      [
        formatarData(r.data),
        r.turno,
        `${r.hora_inicio} - ${r.hora_fim}`,
        r.responsavel || "-",
        r.setor || "-",
      ],
    ],
  });
  y = tableEnd(doc);

  if (r.equipe.length) y = bloco(doc, y, "Equipe presente", r.equipe.join(", "));
  y = bloco(doc, y, "1. Resumo do turno", r.resumo || "-");

  if (r.producao.length) {
    y = titulo(doc, y, "2. Producao");
    autoTable(doc, {
      startY: y,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [30, 90, 54], textColor: 255 },
      head: [["Produto", "Produzido", "Meta", "Refugo", "Reprocesso"]],
      body: r.producao.map((p) => [
        p.produto || "-",
        formatarNumero(p.produzido),
        formatarNumero(p.meta),
        formatarNumero(p.refugo),
        formatarNumero(p.reprocesso),
      ]),
      foot: [["Total", formatarNumero(totalProduzido(r)), formatarNumero(totalMeta(r)), "", ""]],
      footStyles: { fillColor: [214, 234, 198], textColor: 30 },
    });
    y = tableEnd(doc);
  }

  if (r.silos.length) {
    y = titulo(doc, y, "3. Status dos silos");
    for (const grupo of r.silos) {
      const itens = grupo.itens.filter((i) => i.volume || i.produto);
      if (!itens.length) continue;
      y = quebraPagina(doc, y, 14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 90, 54);
      doc.text(grupo.titulo.toUpperCase(), MARGIN, y);
      y += 3;
      autoTable(doc, {
        startY: y,
        theme: "striped",
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [30, 90, 54], textColor: 255 },
        head: [["Silo", "Volume", "Produto"]],
        body: itens.map((i) => [i.numero, i.volume || "-", i.produto || "-"]),
      });
      y = tableEnd(doc);
    }
  }

  if (r.equipamentos.length) {
    y = titulo(doc, y, "4. Equipamentos");
    for (const grupo of r.equipamentos) {
      const itens = grupo.itens.filter((i) => i.status || i.horimetro || i.tela || i.observacao);
      if (!itens.length) continue;
      y = quebraPagina(doc, y, 14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 90, 54);
      doc.text(grupo.titulo.toUpperCase(), MARGIN, y);
      y += 3;
      const head = [
        "Equipamento",
        "Status",
        ...(grupo.mostrarHorimetro ? ["Horimetro"] : []),
        ...(grupo.mostrarTela ? ["Tela"] : []),
        "Observacao",
      ];
      autoTable(doc, {
        startY: y,
        theme: "striped",
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [30, 90, 54], textColor: 255 },
        head: [head],
        body: itens.map((i) => [
          i.nome,
          i.status || "-",
          ...(grupo.mostrarHorimetro ? [i.horimetro || "-"] : []),
          ...(grupo.mostrarTela ? [i.tela || "-"] : []),
          i.observacao || "-",
        ]),
        didParseCell: (data) => {
          const linha = itens[data.row.index];
          if (data.section === "body" && linha?.status.trim().toUpperCase() === "PARADO") {
            data.cell.styles.fillColor = [254, 226, 226];
            data.cell.styles.textColor = [153, 27, 27];
          }
        },
      });
      y = tableEnd(doc);
    }
  }

  if (r.paradas.length) {
    y = titulo(doc, y, `5. Paradas e anomalias (${formatarNumero(tempoParado(r))} min)`);
    autoTable(doc, {
      startY: y,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [30, 90, 54], textColor: 255 },
      head: [["Hora", "Equipamento", "Motivo", "Tempo (min)"]],
      body: r.paradas.map((p) => [
        p.hora || "-",
        p.equipamento || "-",
        p.motivo || "-",
        formatarNumero(p.tempo),
      ]),
    });
    y = tableEnd(doc);
  }

  y = bloco(doc, y, "6. Qualidade", r.qualidade || "-");
  y = bloco(doc, y, "7. Estoque", r.estoque || "-");
  y = bloco(doc, y, "8. Manutencao", r.manutencao || "-");
  y = bloco(
    doc,
    y,
    "9. Seguranca",
    `Acidentes: ${r.seguranca.acidentes} | Quase acidentes: ${r.seguranca.quase_acidentes}\n${r.seguranca.observacoes || "-"}`,
  );
  y = bloco(doc, y, "10. Limpeza e organizacao (5S)", r.limpeza || "-");

  if (r.pendencias.length) {
    y = titulo(doc, y, "11. Pendencias para o proximo turno");
    autoTable(doc, {
      startY: y,
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [30, 90, 54], textColor: 255 },
      head: [["Descricao", "Situacao"]],
      body: r.pendencias.map((p) => [p.descricao || "-", p.resolvida ? "Resolvida" : "Em aberto"]),
    });
    y = tableEnd(doc);
  }

  y = bloco(doc, y, "12. Observacoes", r.observacoes || "-");

  y = titulo(doc, y, "13. Aprovacoes");
  autoTable(doc, {
    startY: y,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4, minCellHeight: 16 },
    headStyles: { fillColor: [30, 90, 54], textColor: 255 },
    head: [["Turno que entregou", "Turno que recebeu", "Assinaturas"]],
    body: [[r.entregue_por || "-", r.recebido_por || "-", ""]],
  });

  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(
      `Gerado em ${new Date().toLocaleString("pt-BR")} - situacao: ${r.status}`,
      MARGIN,
      doc.internal.pageSize.getHeight() - 8,
    );
    doc.text(`Pagina ${i} de ${paginas}`, width - MARGIN, doc.internal.pageSize.getHeight() - 8, {
      align: "right",
    });
  }

  doc.save(`passagem-turno-${r.turno}-${r.data}.pdf`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tableEnd(doc: jsPDF): number {
  return ((doc as any).lastAutoTable?.finalY ?? MARGIN) + 8;
}

function quebraPagina(doc: jsPDF, y: number, altura: number): number {
  if (y + altura > doc.internal.pageSize.getHeight() - 18) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function titulo(doc: jsPDF, y: number, texto: string): number {
  const pos = quebraPagina(doc, y, 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(texto, MARGIN, pos);
  return pos + 4;
}

function bloco(doc: jsPDF, y: number, tituloTexto: string, conteudo: string): number {
  const width = doc.internal.pageSize.getWidth() - MARGIN * 2;
  const linhas = doc.splitTextToSize(conteudo, width) as string[];
  let pos = quebraPagina(doc, y, 12 + linhas.length * 5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(tituloTexto, MARGIN, pos);
  pos += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(50, 50, 50);
  doc.text(linhas, MARGIN, pos);
  return pos + linhas.length * 4.6 + 6;
}
