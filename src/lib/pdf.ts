import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Order, OrderItem, Invoice, CartItem, Profile } from '@/types';
import { formatPrice, formatDate, PAYMENT_METHOD_LABELS } from '@/types';

export function generateInvoicePDF(
  order: Order,
  items: (OrderItem & { products?: { name: string; reference: string } })[],
  invoice: Invoice | null
) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('TechStore', 105, 25, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Congo, Brazzaville', 105, 32, { align: 'center' });
  doc.text('+242 065987740 | m.b.jonathan@icloud.com', 105, 37, { align: 'center' });
  doc.text('Administrateur: BENICIEN JONATHAN MDG', 105, 42, { align: 'center' });

  doc.setDrawColor(200);
  doc.line(20, 42, 190, 42);

  // Invoice title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('FACTURE', 20, 55);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const invoiceNum = invoice?.invoice_number ?? 'N/A';
  doc.text(`N° ${invoiceNum}`, 20, 63);
  doc.text(`Commande: ${order.order_number}`, 20, 69);
  doc.text(`Date: ${formatDate(order.created_at)}`, 20, 75);

  // Order info
  doc.text(`Mode de paiement: ${PAYMENT_METHOD_LABELS[order.payment_method] ?? order.payment_method}`, 120, 63);
  doc.text(`Statut: ${order.status}`, 120, 69);
  doc.text(`Adresse: ${order.delivery_address}`, 120, 75);

  // Table
  autoTable(doc, {
    startY: 85,
    head: [['Produit', 'Référence', 'Qté', 'Prix unitaire', 'Total']],
    body: items.map((item) => [
      item.products?.name ?? 'Produit',
      item.products?.reference ?? '',
      String(item.quantity),
      formatPrice(item.unit_price),
      formatPrice(item.unit_price * item.quantity),
    ]),
    headStyles: { fillColor: [15, 23, 42], fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      2: { halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
    margin: { left: 20, right: 20 },
  });

  // Total
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL: ${formatPrice(order.total)}`, 190, finalY + 15, { align: 'right' });

  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text('Merci pour votre achat !', 105, finalY + 30, { align: 'center' });
  doc.text('TechStore - BENICIEN JONATHAN MDG - Tous droits réservés', 105, finalY + 36, { align: 'center' });

  doc.save(`facture-${order.order_number}.pdf`);
}

export function generateCartPDF(
  items: CartItem[],
  subtotal: number,
  shippingFee: number,
  total: number,
  profile: Profile | null
) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('TechStore', 105, 25, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text('Congo, Brazzaville', 105, 32, { align: 'center' });
  doc.text('+242 065987740 | m.b.jonathan@icloud.com', 105, 37, { align: 'center' });
  doc.text('Administrateur: BENICIEN JONATHAN MDG', 105, 42, { align: 'center' });

  doc.setDrawColor(200);
  doc.line(20, 47, 190, 47);

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('RECAPITULATIF DU PANIER', 20, 58);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`, 20, 66);

  // Client info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Informations client', 20, 78);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const clientName = profile?.full_name ?? 'Client';
  const clientPhone = profile?.phone ?? 'Non renseigne';
  const clientAddress = profile?.address ?? 'Non renseignee';
  doc.text(`Nom: ${clientName}`, 20, 86);
  doc.text(`Telephone: ${clientPhone}`, 20, 92);
  doc.text(`Adresse: ${clientAddress}`, 20, 98);

  // Table
  autoTable(doc, {
    startY: 106,
    head: [['Produit', 'Marque', 'Reference', 'Qté', 'Prix unitaire', 'Total']],
    body: items.map((item) => [
      item.product.name,
      item.product.brand,
      item.product.reference,
      String(item.quantity),
      formatPrice(item.product.price),
      formatPrice(item.product.price * item.quantity),
    ]),
    headStyles: { fillColor: [15, 23, 42], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      3: { halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'right' },
    },
    margin: { left: 20, right: 20 },
  });

  // Totals
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80);
  doc.text(`Sous-total: ${formatPrice(subtotal)}`, 190, finalY + 12, { align: 'right' });
  doc.text(`Frais de livraison: ${formatPrice(shippingFee)}`, 190, finalY + 19, { align: 'right' });

  doc.setDrawColor(200);
  doc.line(120, finalY + 23, 190, finalY + 23);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(`TOTAL: ${formatPrice(total)}`, 190, finalY + 31, { align: 'right' });

  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text('Ce document est un recapitulatif de votre panier - TechStore', 105, finalY + 44, { align: 'center' });
  doc.text('TechStore - BENICIEN JONATHAN MDG - Tous droits reserves', 105, finalY + 50, { align: 'center' });

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`panier-${dateStr}.pdf`);
}
