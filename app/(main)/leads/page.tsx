"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserPlus,
  Replace,
  ChevronsRight,
  RefreshCw,
  Users,
  Star,
  Activity,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import type { Lead } from "@/lib/types";
import * as leadsApi from "@/src/api/leads.api";
import * as dealsApi from "@/src/api/deals.api";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { PaginationControls } from "@/components/ui/pagination-controls";

type LeadStatus = "new" | "in_progress" | "confirmed" | "converted" | "cancelled";

const statusTransitions: Record<LeadStatus, LeadStatus[]> = {
  new: ["in_progress", "confirmed", "cancelled"],
  in_progress: ["confirmed", "cancelled"],
  confirmed: ["cancelled"],
  converted: [],
  cancelled: [],
};

const statusTranslations: Record<LeadStatus, string> = {
  new: "Новый",
  in_progress: "В работе",
  confirmed: "Подтвержден",
  converted: "Конвертирован",
  cancelled: "Отменен",
};
const allStatuses: LeadStatus[] = ["new", "in_progress", "confirmed", "converted", "cancelled"];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"all" | "my">("all");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isAssignUserOpen, setIsAssignUserOpen] = useState(false);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [newLead, setNewLead] = useState({
    title: "",
    description: "",
  });
  const [editLeadData, setEditLeadData] = useState({
    title: "",
    description: "",
    status: "new"
  });
  const [assignLeadData, setAssignLeadData] = useState({ assignee_id: 0, comment: "" });
  const [convertLeadData, setConvertLeadData] = useState({
    client_id: "",
    amount: "",
    currency: "USD",
  });
  const [statusChangeData, setStatusChangeData] = useState({ to: "", comment: "" });

  const user = getCurrentUser();
  const canWrite = user && hasPermission(user.role, ["leads:write"]);

  const [users, setUsers] = useState<any[]>([]);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const currentPage = Number(searchParams.get('page')) || 1;
  const limit = 20;
  const [totalLeads, setTotalLeads] = useState(0);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const fetchFn = view === "my" ? leadsApi.list_my_leads : leadsApi.list_leads;
      const params: any = { page: currentPage, limit };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== "all") params.status = statusFilter;

      const res = await fetchFn(undefined, params);
      const data = (res?.data || (Array.isArray(res) ? res : []));
      const total = res?.total || data.length;

      setLeads(data);
      setTotalLeads(total);
      setError("");
    } catch (err: any) {
      setError(err?.message || "Ошибка при загрузке лидов");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { listUsers } = await import("@/src/api/users.api");
      const res = await listUsers();
      setUsers(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
    }, 300);
    return () => clearTimeout(timer);
  }, [view, currentPage, searchTerm, statusFilter]);

  const getStatusBadge = (status: LeadStatus) => {
    const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
      new: { label: statusTranslations.new, className: "bg-blue-100 text-blue-800" },
      in_progress: { label: statusTranslations.in_progress, className: "bg-yellow-100 text-yellow-800" },
      confirmed: { label: statusTranslations.confirmed, className: "bg-green-100 text-green-800" },
      converted: { label: statusTranslations.converted, className: "bg-purple-100 text-purple-800" },
      cancelled: { label: statusTranslations.cancelled, className: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status] || statusConfig.new;
    return <Badge className={`${config.className} text-xs`}>{config.label}</Badge>;
  };

  // Calculate statistics (Note: reflects current page only if backend pagination is active without separate stats API)
  const stats = {
    total: totalLeads,
    new: leads.filter(l => l.status === 'new').length,
    inProgress: leads.filter(l => l.status === 'in_progress').length,
    converted: leads.filter(l => l.status === 'converted').length,
  };

  const handleCreateLead = async () => {
    if (!user) return;
    try {
      const payload = {
        ...newLead,
        owner_id: user.id ? parseInt(user.id) : 0,
        status: "new",
      };
      const res = await leadsApi.create_lead(payload);
      const created = res?.data || res;
      setLeads((prev) => [created, ...(prev || [])]);
      setNewLead({ title: "", description: "" });
      fetchLeads(); // Refresh to ensure sync
    } catch (err) {
      console.error("Ошибка создания лида:", err);
    } finally {
      setIsCreateDialogOpen(false);
    }
  };

  const handleUpdateLead = async () => {
    if (!selectedLead || !user) return;
    try {
      const payload = {
        ...editLeadData,
        owner_id: selectedLead.owner_id,
      };
      const res = await leadsApi.update_lead(payload, { id: selectedLead.id });
      const updatedLead = res?.data || res;
      setLeads((prev) => (prev || []).map((l) => (l.id === updatedLead.id ? updatedLead : l)));
      fetchLeads();
    } catch (err) {
      console.error("Ошибка обновления лида:", err);
    } finally {
      setIsEditDialogOpen(false);
    }
  };

  const handleDeleteLead = async (leadId: number) => {
    try {
      await leadsApi.delete_lead(undefined, { id: leadId });
      setLeads((prev) => (prev || []).filter((l) => l.id !== leadId));
    } catch (err) {
      console.error("Ошибка удаления лида:", err);
    }
  };

  const handleAssignLead = async () => {
    if (!selectedLead) return;
    try {
      await leadsApi.assign_lead(assignLeadData, { id: selectedLead.id });
      fetchLeads();
    } catch (err) {
      console.error("Ошибка назначения лида:", err);
    } finally {
      setIsAssignDialogOpen(false);
    }
  };

  const handleConvertLead = async () => {
    if (!selectedLead) return;
    try {
      const dealPayload = {
        ...convertLeadData,
        lead_id: selectedLead.id,
        owner_id: selectedLead.owner_id,
        client_id: Number(convertLeadData.client_id),
        status: 'new',
      };
      await dealsApi.create_deal(dealPayload);
      await leadsApi.delete_lead(undefined, { id: selectedLead.id });
      fetchLeads();
    } catch (err) {
      console.error("Ошибка конвертации лида:", err);
    } finally {
      setIsConvertDialogOpen(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!selectedLead) return;
    try {
      await leadsApi.update_lead_status(statusChangeData, { id: selectedLead.id });
      fetchLeads();
    } catch (err) {
      console.error("Ошибка смены статуса:", err);
    } finally {
      setIsStatusDialogOpen(false);
    }
  };

  const openEditDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setEditLeadData({ title: lead.title, description: lead.description, status: lead.status });
    setIsEditDialogOpen(true);
  };

  const openAssignDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setAssignLeadData({ assignee_id: 0, comment: "" });
    setIsAssignDialogOpen(true);
  };

  const openConvertDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setConvertLeadData({
      client_id: "",
      amount: "",
      currency: "USD",
    });
    setIsConvertDialogOpen(true);
  };

  const openStatusDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setStatusChangeData({ to: "", comment: "" });
    setIsStatusDialogOpen(true);
  };

  if (isLoading && (!leads || leads.length === 0)) {
    return (
      <>
        <div className="m-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-24 mb-6" />
          <Skeleton className="h-96" />
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between m-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Лиды
          </h1>
          <p className="text-gray-600">
            Управление потенциальными клиентами
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchLeads}
            variant="outline"
            size="icon"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          {canWrite && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Новый лид
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать новый лид</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Название лида</Label>
                    <Input id="title" placeholder="Введите название лида..." value={newLead.title} onChange={(e) => setNewLead({ ...newLead, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Описание</Label>
                    <Textarea id="description" placeholder="Напишите описание..." value={newLead.description} onChange={(e) => setNewLead({ ...newLead, description: e.target.value })} />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Отмена</Button>
                  <Button onClick={handleCreateLead}>Создать</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-6 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mx-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total}
                </div>
                <p className="text-sm text-gray-600">Всего лидов</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.new}
                </div>
                <p className="text-sm text-gray-600">Новые</p>
              </div>
              <Star className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.inProgress}
                </div>
                <p className="text-sm text-gray-600">В работе</p>
              </div>
              <Activity className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {stats.converted}
                </div>
                <p className="text-sm text-gray-600">Конвертированы</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mx-6 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Введите название или описание..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <CustomSelect
                value={view}
                onChange={(val) => setView(val as "all" | "my")}
                placeholder="Режим просмотра"
                options={[
                  { value: "all", label: "Все лиды" },
                  { value: "my", label: "Мои лиды" },
                ]}
              />
            </div>
            <div className="w-full sm:w-48">
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                placeholder="Статус"
                options={[
                  { value: "all", label: "Все статусы" },
                  ...allStatuses.map(status => ({
                    value: status,
                    label: statusTranslations[status]
                  }))
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="mx-6 mb-6">
        <CardHeader>
          <CardTitle>Список лидов</CardTitle>
          <CardDescription>
            {leads?.length ? `Найдено ${leads.length} лидов` : "Лиды не найдены"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Ответственный</TableHead>
                  <TableHead>Дата создания</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!leads || leads.length === 0) ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Лиды не найдены</TableCell></TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.title}</TableCell>
                      <TableCell>{lead.description}</TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>{lead.owner_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                          {new Date(lead.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(lead)} title="Редактировать">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openAssignDialog(lead)} title="Назначить">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openStatusDialog(lead)}
                            disabled={statusTransitions[lead.status as LeadStatus]?.length === 0}
                            title="Сменить статус"
                          >
                            <Replace className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openConvertDialog(lead)}
                            disabled={lead.status === 'converted' || lead.status === 'cancelled'}
                            title="Конвертировать"
                          >
                            <ChevronsRight className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" title="Удалить">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить лид?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Это действие невозможно отменить. Лид будет удален навсегда.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteLead(lead.id)} className="bg-red-600 hover:bg-red-700">Удалить</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {totalLeads > limit && (
          <div className="pb-4">
            <PaginationControls
              currentPage={currentPage}
              totalPages={Math.ceil(totalLeads / limit)}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </Card >

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать лид</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Название лида</Label>
              <Input id="edit-title" placeholder="Введите название лида..." value={editLeadData.title} onChange={(e) => setEditLeadData({ ...editLeadData, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Описание</Label>
              <Textarea id="edit-description" placeholder="Напишите описание..." value={editLeadData.description} onChange={(e) => setEditLeadData({ ...editLeadData, description: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleUpdateLead}>Сохранить</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Назначить ответственного</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assignee-id">ID Ответственного</Label>
              <div className="flex w-full items-center space-x-2">
                <Input
                  id="assignee-id"
                  type="number"
                  placeholder="Введите ID ответственного..."
                  value={assignLeadData.assignee_id}
                  onChange={(e) => setAssignLeadData({ ...assignLeadData, assignee_id: Number(e.target.value) })}
                />
                <Popover open={isAssignUserOpen} onOpenChange={setIsAssignUserOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Поиск пользователя..." />
                      <CommandList>
                        <CommandEmpty>Пользователь не найден.</CommandEmpty>
                        <CommandGroup>
                          {users.map((u) => (
                            <CommandItem
                              key={u.id}
                              value={`${u.firstName || ""} ${u.lastName || ""} ${u.company_name || ""} ${u.id}`}
                              onSelect={() => {
                                setAssignLeadData({ ...assignLeadData, assignee_id: Number(u.id) });
                                setIsAssignUserOpen(false);
                              }}
                            >
                              <span>{u.firstName ? `${u.firstName} ${u.lastName}` : (u.name || u.company_name || `User ${u.id}`)}</span>
                              <span className="ml-auto text-xs text-gray-400">ID: {u.id}</span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign-comment">Комментарий</Label>
              <Textarea id="assign-comment" placeholder="Напишите комментарий..." value={assignLeadData.comment} onChange={(e) => setAssignLeadData({ ...assignLeadData, comment: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleAssignLead}>Назначить</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Конвертировать в сделку</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-id">ID Клиента</Label>
              <Input id="client-id" placeholder="Введите ID клиента..." value={convertLeadData.client_id} onChange={(e) => setConvertLeadData({ ...convertLeadData, client_id: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Сумма</Label>
              <Input id="amount" type="number" placeholder="Введите сумму..." value={convertLeadData.amount} onChange={(e) => setConvertLeadData({ ...convertLeadData, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Валюта</Label>
              <Input id="currency" placeholder="Введите валюту..." value={convertLeadData.currency} onChange={(e) => setConvertLeadData({ ...convertLeadData, currency: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleConvertLead}>Конвертировать</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить статус</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Текущий статус: {selectedLead && getStatusBadge(selectedLead.status)}</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-status">Новый статус</Label>
              <CustomSelect
                value={statusChangeData.to}
                onChange={(value) => setStatusChangeData({ ...statusChangeData, to: value })}
                placeholder="Выберите новый статус"
                options={selectedLead ? (statusTransitions[selectedLead.status as LeadStatus] || []).map((status) => ({
                  value: status,
                  label: statusTranslations[status]
                })) : []}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-comment">Комментарий</Label>
              <Textarea id="status-comment" placeholder="Напишите комментарий..." value={statusChangeData.comment} onChange={(e) => setStatusChangeData({ ...statusChangeData, comment: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleChangeStatus}>Изменить</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
