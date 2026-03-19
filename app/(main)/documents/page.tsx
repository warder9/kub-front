"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { PaginationControls } from "@/components/ui/pagination-controls"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CustomSelect } from "@/components/ui/custom-select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    FileText,
    Plus,
    Download,
    Trash2,
    MoreHorizontal,
    RefreshCw,
    Eye,
    Send,
    CheckCircle,
    XCircle,
    PenTool,
    ShieldCheck,
    ChevronsUpDown,
    Check,
    Mail,
    KeyRound,
    Loader2,
    FileCheck,
    Clock,
    AlertTriangle,
    ArrowRight,
    Upload,
    Link,
    Copy,
    ExternalLink,
    MessageCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ru } from "date-fns/locale"
import { toast } from "sonner"
import { getCurrentUser, getCurrentCompany, setCurrentUser } from "@/lib/auth"
import * as AuthAPI from "@/src/api/auth.api"
import {
    getDocuments,
    getDocumentsByDeal,
    getDocumentById,
    createDocumentFromClient,
    uploadDocument,
    downloadDocument,
    viewDocumentFile,
    deleteDocument,
    submitDocument,
    reviewDocument,
    generateSignLink,
} from "@/src/api/documents.api"
import type { Document, DocType, DocStatus, SignStatus } from "@/src/models/documents.model"

// ─── Constants ───────────────────────────────────────────────────

const docTypeLabels: Record<string, string> = {
    contract_paid_full_ru: "Договор полной оплаты (рус)",
    contract_paid_50_50_ru: "Договор 50/50 (рус)",
    contract_free_ru: "Договор (бесплатный, рус)",
    refund_application: "Заявление на возврат",
    pause_application: "Заявление на паузу",
    avr_kub_group: "АВР KUB Group",
    receipt_refund_full: "Расписка о полном возврате",
    receipt_refund_partial: "Расписка о частичном возврате",
    cancel_appointment: "Заявление на отмену записи",
    documents_handover_act: "Акт приёма-передачи документов",
    visa_questionnaire: "Визовый опросник",
    termination_transfer: "Соглашение о расторжении с передачей",
    termination_waiver: "Соглашение о расторжении с отказом от претензий",
    contract_language_courses: "Договор на языковые курсы",
    addendum_korea: "Дополнительное соглашение (Корея)",
}

// Only main types for creation
const creatableDocTypes: { value: string; label: string }[] = [
    { value: "contract_paid_full_ru", label: "Договор полной оплаты (рус)" },
    { value: "contract_paid_50_50_ru", label: "Договор 50/50 (рус)" },
    { value: "refund_application", label: "Заявление на возврат" },
    { value: "pause_application", label: "Заявление на паузу" },
]

const statusLabels: Record<string, string> = {
    draft: "Черновик",
    under_review: "На проверке",
    approved: "Утвержден",
    returned: "Возвращён",
    signed: "Подписан",
}

const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-800",
    under_review: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    returned: "bg-orange-100 text-orange-800",
    signed: "bg-blue-100 text-blue-800",
}

const signStatusLabels: Record<string, string> = {
    pending: "Ожидание",
    approved: "Подтверждено",
    expired: "Истекло",
}

const signStatusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    expired: "bg-red-100 text-red-700",
}

// Extra keys by doc type
function getExtraDefaults(docType: string): Record<string, any> {
    switch (docType) {
        case "contract_paid_full_ru":
            return { CONTRACT_NUMBER: "", CONTRACT_DATE_TEXT: "" }
        case "contract_paid_50_50_ru":
            return { CONTRACT_NUMBER: "", CONTRACT_DATE_TEXT: "", PREPAY_AMOUNT_NUM: "", PREPAY_AMOUNT_TEXT: "" }
        case "refund_application":
            return { reason_code: "", REFUND_REASON_TEXT: "", REFUND_AMOUNT_NUM: "", REFUND_AMOUNT_TEXT: "" }
        case "pause_application":
            return { reason_code: "", PAUSE_REASON_TEXT: "", PAUSE_FROM_DATE: "", PAUSE_TO_DATE: "" }
        default:
            return {}
    }
}

// ─── Combobox Component ──────────────────────────────────────────

function ComboboxSelect({
    value,
    onChange,
    options,
    placeholder = "Выберите...",
    searchPlaceholder = "Поиск...",
    emptyText = "Ничего не найдено",
    disabled = false,
}: {
    value: string | number
    onChange: (value: string) => void
    options: { value: string; label: string }[]
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    disabled?: boolean
}) {
    const [open, setOpen] = useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between font-normal bg-background px-3 py-2 text-sm border-input border rounded-xl h-10 hover:bg-accent hover:text-accent-foreground",
                        !value && "text-muted-foreground"
                    )}
                    disabled={disabled}
                >
                    <span className="truncate">
                        {value
                            ? options.find((o) => o.value === value.toString())?.label || placeholder
                            : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                        onChange(option.value)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value?.toString() === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

// ─── Role helper ─────────────────────────────────────────────────

function getRoleKey(roleId?: number): string {
    const map: Record<number, string> = { 40: "management", 30: "admin", 20: "control", 10: "operations", 5: "sales" }
    return map[roleId || 0] || "user"
}

// ─── Main Page ───────────────────────────────────────────────────

export default function DocumentsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()

    const [documents, setDocuments] = useState<Document[]>([])
    const [totalDocuments, setTotalDocuments] = useState(0)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)

    const [clients, setClients] = useState<any[]>([])
    const [deals, setDeals] = useState<any[]>([])
    const [currentUser, setCurrentUserState] = useState<any>(null)
    const [freshUserData, setFreshUserData] = useState<any>(null)
    const [isReadOnly, setIsReadOnly] = useState(false)
    const [selectedDealId, setSelectedDealId] = useState<number | null>(null)
    
    // Get fresh user data or fallback to state
    const user = freshUserData || currentUser;
    
    // Fetch fresh user data on mount
    useEffect(() => {
        const fetchFreshUserData = async () => {
            try {
                console.log('Fetching fresh user data for documents page...');
                const userData = await AuthAPI.getMe();
                console.log('Fresh user data received in documents:', userData);
                
                // Transform API response to match User interface
                const transformedUser = {
                    id: String(userData.id),
                    firstName: userData.company_name || userData.email?.split('@')[0] || '',
                    lastName: '',
                    email: userData.email,
                    phone: userData.phone,
                    role: userData.role_id === 40 ? 'management' : 
                          userData.role_id === 5 ? 'sales' : 
                          userData.role_id === 10 ? 'operations' : 
                          userData.role_id === 20 ? 'control' : 
                          userData.role_id === 30 ? 'admin' : 'user',
                    role_id: userData.role_id,
                    company_name: userData.company_name,
                    bin_iin: userData.bin_iin,
                    is_verified: userData.is_verified,
                    verified_at: userData.verified_at,
                    telegram_chat_id: userData.telegram_chat_id,
                    notify_tasks_telegram: userData.notify_tasks_telegram,
                    status: 'active'
                };
                
                console.log('Transformed user data in documents:', transformedUser);
                setFreshUserData(transformedUser);
                
                // Update localStorage with fresh data
                setCurrentUser(transformedUser);
                setCurrentUserState(transformedUser);
            } catch (error) {
                console.error('Failed to fetch fresh user data in documents:', error);
            }
        };
        
        fetchFreshUserData();
    }, []); // Run once on mount

    // ─── Create form state ──────────────────────────────────────

    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [createForm, setCreateForm] = useState({
        client_id: "",
        deal_id: "",
        doc_type: "contract_paid_full_ru" as string,
        extra: {} as Record<string, any>,
    })

    // ─── Details / View ─────────────────────────────────────────

    const [isDetailsOpen, setIsDetailsOpen] = useState(false)
    const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)

    // ─── Delete ─────────────────────────────────────────────────

    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [deleteId, setDeleteId] = useState<number | null>(null)

    // ─── Review ─────────────────────────────────────────────────

    const [isReviewOpen, setIsReviewOpen] = useState(false)
    const [reviewDoc, setReviewDoc] = useState<Document | null>(null)

    // ─── Send for signing (link-based) ────────────────────────────

    const [isSignLinkOpen, setIsSignLinkOpen] = useState(false)
    const [signLinkDoc, setSignLinkDoc] = useState<Document | null>(null)
    const [signLinkUrl, setSignLinkUrl] = useState("")
    const [signLinkLoading, setSignLinkLoading] = useState(false)

    // ─── Pagination ─────────────────────────────────────────────

    const currentPage = Number(searchParams.get("page")) || 1
    const size = 50

    // ─── Data loading ───────────────────────────────────────────

    const fetchDocuments = useCallback(async () => {
        setLoading(true)
        try {
            const params: any = { page: currentPage, size }
            const res = await getDocuments(params)
            const data = Array.isArray(res) ? res : (res as any)?.data || []
            setDocuments(data)
            setTotalDocuments((res as any)?.total || data.length)
        } catch (err: any) {
            console.error("Error loading documents:", err)
            toast.error(err?.message || "Ошибка при загрузке документов")
            setDocuments([])
            setTotalDocuments(0)
        } finally {
            setLoading(false)
        }
    }, [currentPage, size])

    useEffect(() => {
        if (freshUserData) {
            fetchDocuments()
        }
    }, [fetchDocuments, freshUserData])

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams)
        params.set("page", page.toString())
        router.push(`${pathname}?${params.toString()}`)
    }

    // ─── Create handler ─────────────────────────────────────────

    const openCreate = () => {
        setCreateForm({
            client_id: "",
            deal_id: "",
            doc_type: "contract_paid_full_ru",
            extra: getExtraDefaults("contract_paid_full_ru"),
        })
        setIsCreateOpen(true)
    }

    const handleDocTypeChange = (val: string) => {
        setCreateForm((prev) => ({
            ...prev,
            doc_type: val,
            extra: getExtraDefaults(val),
        }))
    }

    const handleExtraChange = (key: string, val: string) => {
        setCreateForm((prev) => ({
            ...prev,
            extra: { ...prev.extra, [key]: val },
        }))
    }

    const handleCreate = async () => {
        if (!createForm.client_id || !createForm.deal_id) {
            toast.error("Выберите клиента и сделку")
            return
        }
        setActionLoading(true)
        try {
            const payload: any = {
                client_id: Number(createForm.client_id),
                deal_id: Number(createForm.deal_id),
                doc_type: createForm.doc_type,
            }
            // Attach extra if has values
            const hasExtra = Object.values(createForm.extra).some((v) => v !== "")
            if (hasExtra) {
                payload.extra = createForm.extra
            }
            await createDocumentFromClient(payload)
            toast.success("Документ создан")
            setIsCreateOpen(false)
            await fetchDocuments()
        } catch (err: any) {
            console.error("Error creating document:", err)
            toast.error(err?.message || "Ошибка при создании документа")
        } finally {
            setActionLoading(false)
        }
    }

    // ─── Upload file to existing document ────────────────────────

    const uploadInputRef = useRef<HTMLInputElement>(null)
    const uploadTargetDoc = useRef<Document | null>(null)

    const triggerUploadForDoc = (doc: Document) => {
        if (!doc.deal_id) {
            toast.error("У документа отсутствует deal_id. Загрузка невозможна.")
            return
        }
        uploadTargetDoc.current = doc
        // Reset and trigger file input
        if (uploadInputRef.current) {
            uploadInputRef.current.value = ""
            uploadInputRef.current.click()
        }
    }

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        const doc = uploadTargetDoc.current
        if (!file || !doc) return

        if (!doc.deal_id) {
            toast.error("У документа отсутствует deal_id")
            return
        }

        setActionLoading(true)
        try {
            await uploadDocument({
                deal_id: Number(doc.deal_id),
                doc_type: doc.doc_type,
                file,
            })
            toast.success("Файл успешно загружен")
            await fetchDocuments()
        } catch (err: any) {
            console.error("Error uploading file:", err)
            toast.error(err?.response?.data?.message || err?.message || "Ошибка загрузки файла")
        } finally {
            setActionLoading(false)
            uploadTargetDoc.current = null
        }
    }

    // ─── View file (inline) ────────────────────────────────────

    const handleViewFile = async (doc: Document) => {
        try {
            const blob = await viewDocumentFile(doc.id)
            const url = URL.createObjectURL(blob)
            window.open(url, "_blank")
        } catch (err: any) {
            console.error("Error viewing file:", err)
            toast.error(err?.message || "Ошибка при просмотре файла")
        }
    }

    // ─── Download ───────────────────────────────────────────────

    const handleDownload = async (doc: Document) => {
        try {
            const blob = await downloadDocument(doc.id, "pdf")
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            const filename = doc.file_path_pdf || doc.file_path_docx || `document-${doc.id}.pdf`
            a.setAttribute("download", filename.split("/").pop() || filename)
            document.body.appendChild(a)
            a.click()
            a.remove()
            URL.revokeObjectURL(url)
            toast.success("Документ скачан")
        } catch (err: any) {
            console.error("Error downloading:", err)
            toast.error(err?.message || "Ошибка при скачивании")
        }
    }

    // ─── Delete ─────────────────────────────────────────────────

    const handleDeleteConfirm = async () => {
        if (!deleteId) return
        try {
            await deleteDocument(deleteId)
            toast.success("Документ удалён")
            await fetchDocuments()
        } catch (err: any) {
            console.error("Error deleting:", err)
            toast.error(err?.message || "Ошибка при удалении")
        } finally {
            setIsDeleteOpen(false)
            setDeleteId(null)
        }
    }

    // ─── Submit (draft -> under_review) ─────────────────────────

    const handleSubmit = async (doc: Document) => {
        setActionLoading(true)
        try {
            await submitDocument(doc.id)
            toast.success("Документ отправлен на проверку")
            await fetchDocuments()
        } catch (err: any) {
            console.error("Error submitting:", err)
            toast.error(err?.message || "Ошибка при отправке на ревью")
        } finally {
            setActionLoading(false)
        }
    }

    // ─── Review (approve / return) ──────────────────────────────

    const handleReview = async (action: "approve" | "return") => {
        if (!reviewDoc) return
        setActionLoading(true)
        try {
            await reviewDocument(reviewDoc.id, action)
            toast.success(action === "approve" ? "Документ утверждён" : "Документ возвращён")
            setIsReviewOpen(false)
            setReviewDoc(null)
            await fetchDocuments()
        } catch (err: any) {
            console.error("Error reviewing:", err)
            toast.error(err?.message || "Ошибка при ревью")
        } finally {
            setActionLoading(false)
        }
    }

    // ─── Send for signing (generate link) ─────────────────────────

    /** Ensure any URL uses https:// protocol */
    const enforceHttps = (url: string): string => {
        return url.replace(/^http:\/\//i, 'https://')
    }

    /** Get the base app URL, always over HTTPS */
    const getSecureBaseUrl = (): string => {
        // 1. Prefer explicit env variable
        const envUrl = process.env.NEXT_PUBLIC_APP_URL
        if (envUrl) return enforceHttps(envUrl.replace(/\/$/, ''))
        // 2. Fallback to window.location.origin, enforcing https
        if (typeof window !== 'undefined') {
            return enforceHttps(window.location.origin)
        }
        return 'https://89.35.124.133:4000'
    }

    const handleSendForSign = async (doc: Document) => {
        setSignLinkDoc(doc)
        setSignLinkUrl("")
        setIsSignLinkOpen(true)
        setSignLinkLoading(true)
        try {
            const res = await generateSignLink(doc.id)
            // Always enforce HTTPS on the generated link
            const rawUrl = res?.url || `${getSecureBaseUrl()}/public/sign/${res?.token}`
            const publicUrl = enforceHttps(rawUrl)
            setSignLinkUrl(publicUrl)
            toast.success("Ссылка для подписи сгенерирована")
        } catch (err: any) {
            console.error("Error generating sign link:", err)
            toast.error(err?.message || "Ошибка генерации ссылки подписания")
        } finally {
            setSignLinkLoading(false)
        }
    }

    const handleCopySignLink = () => {
        if (!signLinkUrl) return
        navigator.clipboard.writeText(signLinkUrl)
        toast.success("Ссылка скопирована в буфер обмена")
    }

    const handleShareWhatsApp = () => {
        if (!signLinkUrl) return
        const text = encodeURIComponent(`Пожалуйста, подпишите документ по ссылке: ${signLinkUrl}`)
        window.open(`https://wa.me/?text=${text}`, "_blank")
    }

    const handleShareTelegram = () => {
        if (!signLinkUrl) return
        const text = encodeURIComponent(`Пожалуйста, подпишите документ по ссылке: ${signLinkUrl}`)
        window.open(`https://t.me/share/url?url=${encodeURIComponent(signLinkUrl)}&text=${text}`, "_blank")
    }

    // ─── Details ────────────────────────────────────────────────

    const handleShowDetails = async (id: number) => {
        try {
            const doc = await getDocumentById(id)
            setSelectedDoc(doc)
            setIsDetailsOpen(true)
        } catch (err: any) {
            console.error("Error loading details:", err)
            toast.error(err?.message || "Ошибка при загрузке деталей")
        }
    }

    // ─── Helpers ────────────────────────────────────────────────

    const getClientLabel = (clientId: number) => {
        const c = clients.find((cl) => cl.id?.toString() === clientId?.toString())
        if (!c) return `Клиент #${clientId}`
        return c.first_name ? `${c.first_name} ${c.last_name || ""}`.trim() : (c.name || `Клиент #${clientId}`)
    }

    const getDealLabel = (dealId: number) => {
        const d = deals.find((dl) => dl.id?.toString() === dealId?.toString())
        if (!d) return `Сделка #${dealId}`
        return d.amount ? `${Number(d.amount).toLocaleString()} ₸ (#${d.id})` : `Сделка #${d.id}`
    }

    const clientOptions = clients.map((c) => ({
        value: c.id.toString(),
        label: c.first_name ? `${c.first_name} ${c.last_name || ""}`.trim() : (c.name || `#${c.id}`),
    }))

    const dealOptions = deals.map((d) => ({
        value: d.id.toString(),
        label: d.amount ? `${Number(d.amount).toLocaleString()} ₸ (#${d.id})` : `Сделка #${d.id}`,
    }))

    // ─── Stats ──────────────────────────────────────────────────

    const stats = {
        total: totalDocuments,
        draft: documents.filter((d) => d.status === "draft").length,
        underReview: documents.filter((d) => d.status === "under_review").length,
        signed: documents.filter((d) => d.status === "signed").length,
    }

    // ─── Skeleton ───────────────────────────────────────────────

    if (loading && documents.length === 0) {
        return (
            <>
                <Skeleton className="h-8 w-48 mb-4 m-6" />
                <Skeleton className="h-4 w-64 mb-8 ml-6" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 mx-6">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
                <Skeleton className="h-96 mx-6" />
            </>
        )
    }

    // ─── Render ─────────────────────────────────────────────────

    return (
        <>
            {/* Hidden file input for per-row uploads */}
            <input
                type="file"
                ref={uploadInputRef}
                className="hidden"
                accept=".pdf,.docx,.doc,.xlsx,.xls"
                onChange={handleFileSelected}
            />
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between m-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Документы</h1>
                    <p className="text-gray-600">Управление документооборотом и подписанием</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchDocuments} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </Button>
                    {!isReadOnly && (
                        <Button onClick={openCreate}>
                            <Plus className="h-4 w-4 mr-2" />
                            Создать документ
                        </Button>
                    )}
                </div>
            </div>

            {/* Deal Filter for Sales Users */}
            {(currentUser?.role === 'sales' || currentUser?.role_id === 5) && (
                <div className="mx-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 max-w-sm">
                            <Label htmlFor="deal-filter">Фильтр по сделке</Label>
                            <ComboboxSelect
                                value={selectedDealId || ""}
                                onChange={(val) => setSelectedDealId(val ? Number(val) : null)}
                                options={[
                                    { value: "", label: "Все сделки" },
                                    ...dealOptions
                                ]}
                                placeholder="Выберите сделку..."
                                searchPlaceholder="Поиск сделки..."
                                emptyText="Сделки не найдены"
                            />
                        </div>
                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                onClick={() => setSelectedDealId(null)}
                                disabled={!selectedDealId}
                            >
                                Сбросить
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 mx-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                                <p className="text-sm text-gray-600">Всего</p>
                            </div>
                            <FileText className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
                                <p className="text-sm text-gray-600">Черновики</p>
                            </div>
                            <Clock className="h-8 w-8 text-gray-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-yellow-600">{stats.underReview}</div>
                                <p className="text-sm text-gray-600">На проверке</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-2xl font-bold text-green-600">{stats.signed}</div>
                                <p className="text-sm text-gray-600">Подписано</p>
                            </div>
                            <FileCheck className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Documents Table */}
            <Card className="mx-6 mb-6">
                <CardHeader>
                    <CardTitle>Список документов</CardTitle>
                    <CardDescription>
                        {documents.length > 0
                            ? `Найдено ${totalDocuments} документов`
                            : "Документов не найдено"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!documents || documents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <FileText className="h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500 font-medium text-lg">Документов не найдено</p>
                            <p className="text-sm text-gray-400 mt-1">Создайте первый документ из шаблона</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Тип документа</TableHead>
                                        <TableHead>Клиент</TableHead>
                                        <TableHead>Сделка</TableHead>
                                        <TableHead>Статус</TableHead>
                                        <TableHead>Подписание</TableHead>
                                        <TableHead>Дата создания</TableHead>
                                        <TableHead className="text-right">Действия</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.map((doc) => {
                                        const canSubmit = doc.status === "draft"
                                        const canReview = doc.status === "under_review"
                                        const canSign = doc.status === "approved"
                                        const canDelete = !isReadOnly

                                        return (
                                            <TableRow key={doc.id}>
                                                <TableCell className="font-mono text-sm">{doc.id}</TableCell>
                                                <TableCell>{docTypeLabels[doc.doc_type] || doc.doc_type}</TableCell>
                                                <TableCell className="text-sm">
                                                    {doc.client_id ? getClientLabel(doc.client_id) : "—"}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {doc.deal_id ? getDealLabel(doc.deal_id) : "—"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`${statusColors[doc.status] || "bg-gray-100 text-gray-700"} text-xs`}>
                                                        {statusLabels[doc.status] || doc.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {doc.sign_status ? (
                                                        <Badge className={`${signStatusColors[doc.sign_status] || "bg-gray-100 text-gray-700"} text-xs`}>
                                                            {signStatusLabels[doc.sign_status] || doc.sign_status}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {format(new Date(doc.created_at), "dd.MM.yyyy", { locale: ru })}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleShowDetails(doc.id)}>
                                                                <FileText className="h-4 w-4 mr-2" />
                                                                Детали
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleViewFile(doc)}>
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                Просмотр
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                                                <Download className="h-4 w-4 mr-2" />
                                                                Скачать PDF
                                                            </DropdownMenuItem>
                                                            {!isReadOnly && (
                                                                <DropdownMenuItem onClick={() => triggerUploadForDoc(doc)}>
                                                                    <Upload className="h-4 w-4 mr-2" />
                                                                    Загрузить файл
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />

                                                            {/* Lifecycle actions */}
                                                            {!isReadOnly && canSubmit && (
                                                                <DropdownMenuItem onClick={() => handleSubmit(doc)}>
                                                                    <Send className="h-4 w-4 mr-2" />
                                                                    Отправить на проверку
                                                                </DropdownMenuItem>
                                                            )}
                                                            {!isReadOnly && canReview && (
                                                                <DropdownMenuItem onClick={() => { setReviewDoc(doc); setIsReviewOpen(true) }}>
                                                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                                                    Ревью
                                                                </DropdownMenuItem>
                                                            )}
                                                            {!isReadOnly && canSign && (
                                                                <DropdownMenuItem onClick={() => handleSendForSign(doc)}>
                                                                    <Link className="h-4 w-4 mr-2" />
                                                                    Отправить на подпись
                                                                </DropdownMenuItem>
                                                            )}

                                                            {canDelete && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        onClick={() => { setDeleteId(doc.id); setIsDeleteOpen(true) }}
                                                                        className="text-red-600"
                                                                    >
                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                        Удалить
                                                                    </DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
                {totalDocuments > size && (
                    <div className="pb-4">
                        <PaginationControls
                            currentPage={currentPage}
                            totalPages={Math.ceil(totalDocuments / size)}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </Card>

            {/* ── Create Document Dialog ─────────────────────────────── */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Создать документ</DialogTitle>
                        <DialogDescription>
                            Генерация документа из шаблона на основе данных клиента и сделки.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Клиент <span className="text-red-500">*</span></Label>
                            <ComboboxSelect
                                value={createForm.client_id}
                                onChange={(val) => setCreateForm({ ...createForm, client_id: val })}
                                options={clientOptions}
                                placeholder="Выберите клиента"
                                searchPlaceholder="Поиск клиента..."
                            />
                            {!createForm.client_id && (
                                <p className="text-xs text-red-500">Выберите клиента</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Сделка <span className="text-red-500">*</span></Label>
                            <ComboboxSelect
                                value={createForm.deal_id}
                                onChange={(val) => setCreateForm({ ...createForm, deal_id: val })}
                                options={dealOptions}
                                placeholder="Выберите сделку"
                                searchPlaceholder="Поиск сделки..."
                            />
                            {!createForm.deal_id && (
                                <p className="text-xs text-red-500">Выберите сделку</p>
                            )}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Тип документа</Label>
                            <CustomSelect
                                value={createForm.doc_type}
                                onChange={handleDocTypeChange}
                                placeholder="Выберите тип"
                                options={creatableDocTypes}
                            />
                        </div>

                        {/* Extra fields based on doc_type */}
                        {Object.keys(createForm.extra).length > 0 && (
                            <div className="md:col-span-2 border-t pt-4 mt-2">
                                <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                                    Дополнительные поля для шаблона
                                </Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {Object.entries(createForm.extra).map(([key, val]) => (
                                        <div key={key} className="space-y-1">
                                            <Label className="text-xs text-gray-500">{key}</Label>
                                            <Input
                                                value={val || ""}
                                                onChange={(e) => handleExtraChange(key, e.target.value)}
                                                placeholder={`Введите ${key}...`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="ghost">Отмена</Button>
                        </DialogClose>
                        <Button
                            onClick={handleCreate}
                            disabled={actionLoading || !createForm.client_id || !createForm.deal_id}
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Генерация...
                                </>
                            ) : (
                                "Сгенерировать"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Details Dialog ──────────────────────────────────────── */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Документ #{selectedDoc?.id}</DialogTitle>
                        <DialogDescription>Подробная информация</DialogDescription>
                    </DialogHeader>
                    {selectedDoc && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm text-gray-500">Тип</Label>
                                    <p className="font-medium">{docTypeLabels[selectedDoc.doc_type] || selectedDoc.doc_type}</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-500">Статус</Label>
                                    <div className="mt-1">
                                        <Badge className={`${statusColors[selectedDoc.status] || "bg-gray-100"} text-xs`}>
                                            {statusLabels[selectedDoc.status] || selectedDoc.status}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-500">ID Сделки</Label>
                                    <p className="font-medium">{selectedDoc.deal_id ? getDealLabel(selectedDoc.deal_id) : "—"}</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-500">Клиент</Label>
                                    <p className="font-medium">{selectedDoc.client_id ? getClientLabel(selectedDoc.client_id) : "—"}</p>
                                </div>
                                <div>
                                    <Label className="text-sm text-gray-500">Дата создания</Label>
                                    <p className="font-medium">
                                        {format(new Date(selectedDoc.created_at), "dd.MM.yyyy HH:mm", { locale: ru })}
                                    </p>
                                </div>
                                {selectedDoc.sign_status && (
                                    <div>
                                        <Label className="text-sm text-gray-500">Подписание</Label>
                                        <div className="mt-1">
                                            <Badge className={`${signStatusColors[selectedDoc.sign_status] || "bg-gray-100"} text-xs`}>
                                                {signStatusLabels[selectedDoc.sign_status] || selectedDoc.sign_status}
                                            </Badge>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {selectedDoc.file_path_pdf && (
                                <div>
                                    <Label className="text-sm text-gray-500">PDF файл</Label>
                                    <p className="text-xs text-gray-600 break-all">{selectedDoc.file_path_pdf}</p>
                                </div>
                            )}
                            {selectedDoc.file_path_docx && (
                                <div>
                                    <Label className="text-sm text-gray-500">DOCX файл</Label>
                                    <p className="text-xs text-gray-600 break-all">{selectedDoc.file_path_docx}</p>
                                </div>
                            )}
                        </div>
                    )}
                    <DialogFooter className="flex gap-2">
                        {selectedDoc && (
                            <>
                                <Button variant="outline" onClick={() => handleViewFile(selectedDoc)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Просмотр
                                </Button>
                                <Button variant="outline" onClick={() => handleDownload(selectedDoc)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Скачать
                                </Button>
                            </>
                        )}
                        <Button onClick={() => setIsDetailsOpen(false)}>Закрыть</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete Dialog ───────────────────────────────────────── */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Удалить документ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Это действие нельзя отменить. Если данные в документе неверны — удалите его и создайте новый.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                            Удалить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Review Dialog ───────────────────────────────────────── */}
            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ревью документа #{reviewDoc?.id}</DialogTitle>
                        <DialogDescription>
                            Утвердите или верните документ на доработку.
                        </DialogDescription>
                    </DialogHeader>
                    {reviewDoc && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Тип:</span>
                                <span className="font-medium">{docTypeLabels[reviewDoc.doc_type] || reviewDoc.doc_type}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Текущий статус:</span>
                                <Badge className={`${statusColors[reviewDoc.status] || "bg-gray-100"} text-xs`}>
                                    {statusLabels[reviewDoc.status] || reviewDoc.status}
                                </Badge>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="flex gap-2">
                        <DialogClose asChild>
                            <Button variant="ghost">Отмена</Button>
                        </DialogClose>
                        <Button
                            variant="outline"
                            onClick={() => handleReview("return")}
                            disabled={actionLoading}
                            className="border-orange-300 text-orange-700 hover:bg-orange-50"
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Вернуть
                        </Button>
                        <Button
                            onClick={() => handleReview("approve")}
                            disabled={actionLoading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {actionLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Утвердить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Send for Signing Dialog (Link-based) ────────────────── */}
            <Dialog open={isSignLinkOpen} onOpenChange={setIsSignLinkOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            <div className="flex items-center gap-2">
                                <Link className="h-5 w-5 text-blue-600" />
                                Отправить на подпись
                            </div>
                        </DialogTitle>
                        <DialogDescription>
                            Документ #{signLinkDoc?.id} — {signLinkDoc ? (docTypeLabels[signLinkDoc.doc_type] || signLinkDoc.doc_type) : ""}
                        </DialogDescription>
                    </DialogHeader>

                    {signLinkLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="text-sm text-gray-500">Генерация ссылки для подписи...</p>
                        </div>
                    ) : signLinkUrl ? (
                        <div className="space-y-5">
                            {/* Link display */}
                            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                <p className="text-xs text-blue-700 font-medium mb-2">Ссылка для клиента:</p>
                                <div className="flex items-center gap-2">
                                    <Input
                                        readOnly
                                        value={signLinkUrl}
                                        className="bg-white text-sm font-mono"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={handleCopySignLink}
                                        title="Копировать"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Quick share buttons */}
                            <div className="space-y-2">
                                <p className="text-xs text-gray-500 font-medium">Быстрая отправка:</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleShareWhatsApp}
                                        className="border-green-200 text-green-700 hover:bg-green-50 h-11"
                                    >
                                        <MessageCircle className="h-4 w-4 mr-2" />
                                        WhatsApp
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleShareTelegram}
                                        className="border-blue-200 text-blue-700 hover:bg-blue-50 h-11"
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        Telegram
                                    </Button>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                    <div className="text-xs text-gray-600">
                                        <p>Клиент откроет ссылку, просмотрит документ и поставит графическую подпись.</p>
                                        <p className="mt-1">После подписания вы получите <strong>уведомление в Telegram</strong>, а статус документа изменится автоматически.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
                            <XCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                            <p className="text-sm text-red-700">Не удалось сгенерировать ссылку</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => signLinkDoc && handleSendForSign(signLinkDoc)}
                                className="mt-3"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Повторить
                            </Button>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsSignLinkOpen(false)}>Закрыть</Button>
                        {signLinkUrl && (
                            <Button onClick={handleCopySignLink}>
                                <Copy className="h-4 w-4 mr-2" />
                                Копировать ссылку
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
