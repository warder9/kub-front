"use client";

import { useState, useEffect, useMemo } from "react";
import type { User } from "@/src/models/users.model";
import * as Models from "@/src/models/clients.model";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import * as ClientAPI from "@/src/api/clients.api";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PaginationControls } from "@/components/ui/pagination-controls";

const EMPTY_CLIENT: Models.CreateClientRequest = {
  name: "",
  bin_iin: "",
  address: "",
  contact_info: "",
  last_name: "",
  first_name: "",
  middle_name: "",
  iin: "",
  id_number: "",
  passport_series: "",
  passport_number: "",
  phone: "",
  email: "",
  registration_address: "",
  actual_address: "",
};

const DetailItem = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium">{value || "-"}</p>
  </div>
);

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clientFormData, setClientFormData] =
    useState<Models.CreateClientRequest>(EMPTY_CLIENT);
  const [editingClient, setEditingClient] = useState<Models.Client | null>(
    null
  );
  const [clientToDelete, setClientToDelete] = useState<Models.Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Models.Client | null>(null);

  const [clients, setClients] = useState<Models.Client[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [clientView, setClientView] = useState<"all" | "my">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const currentPage = Number(searchParams.get('page')) || 1;
  const limit = 20;

  const { toast } = useToast();
  const user = useMemo(() => getCurrentUser(), []);
  const canCreate = user && hasPermission(user.role, ["clients:write"]);
  const canEdit = user && hasPermission(user.role, ["clients:write"]);
  const canDelete = user && hasPermission(user.role, ["clients:write"]);

  const fetchClients = async () => {
    setIsLoading(true);
    setError("");
    try {
      const params: any = { page: currentPage, limit };
      if (searchTerm) params.search = searchTerm;

      const res =
        clientView === "all"
          ? await ClientAPI.listClients(params)
          : await ClientAPI.listMyClients(params);

      const data = Array.isArray(res) ? res : (res as any)?.data || [];
      const total = (res as any)?.total || data.length;

      setClients(Array.isArray(data) ? data : []);
      setTotalClients(total);
    } catch (err: any) {
      setError(err?.message || "Ошибка при загрузке клиентов");
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: err?.message || "Не удалось загрузить клиентов.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    fetchClients();
  }, [clientView, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== "") fetchClients();
      else fetchClients();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setClientFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleCreateClick = () => {
    setEditingClient(null);
    setClientFormData(EMPTY_CLIENT);
    setIsFormOpen(true);
  };

  const handleEditClick = (client: Models.Client) => {
    setEditingClient(client);
    setClientFormData({
      name: client.name || "",
      bin_iin: client.bin_iin || "",
      address: client.address || "",
      contact_info: client.contact_info || "",
      last_name: client.last_name || "",
      first_name: client.first_name || "",
      middle_name: client.middle_name || "",
      iin: client.iin || "",
      id_number: client.id_number || "",
      passport_series: client.passport_series || "",
      passport_number: client.passport_number || "",
      phone: client.phone || "",
      email: client.email || "",
      registration_address: client.registration_address || "",
      actual_address: client.actual_address || "",
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = (client: Models.Client) => {
    setClientToDelete(client);
  };

  const handleViewClick = (client: Models.Client) => {
    setViewingClient(client);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    try {
      await ClientAPI.deleteClient(clientToDelete.id.toString());
      toast({ title: "Успех", description: "Клиент успешно удален." });
      void fetchClients(); // Refresh list
    } catch (err: any) {
      console.error("Delete client error", err);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: err?.message || "Не удалось удалить клиента.",
      });
    } finally {
      setClientToDelete(null);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingClient) {
        await ClientAPI.updateClient(editingClient.id.toString(), clientFormData);
        toast({ title: "Успех", description: "Клиент успешно обновлен." });
      } else {
        await ClientAPI.createClient(clientFormData);
        toast({ title: "Успех", description: "Клиент успешно создан." });
      }
      void fetchClients(); // Refresh list
    } catch (err: any) {
      console.error("Form submit error", err);
      setError(err?.message || "Произошла ошибка.");
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: err?.message || "Не удалось сохранить клиента.",
      });
    } finally {
      setIsFormOpen(false);
    }
  };



  return (
    <div className="flex flex-col gap-6 w-full p-6">
      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Клиенты
          </h1>
          <p className="text-sm text-gray-600">
            Управление базой клиентов
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => fetchClients()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>
          {canCreate && (
            <Button onClick={handleCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить клиента
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Введите данные для поиска..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={clientView === "all" ? "secondary" : "outline"}
              onClick={() => setClientView("all")}
            >
              Все клиенты
            </Button>
            <Button
              variant={clientView === "my" ? "secondary" : "outline"}
              onClick={() => setClientView("my")}
            >
              Мои клиенты
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список клиентов</CardTitle>
          <CardDescription>
            {clients?.length ? `Найдено ${clients.length} из ${totalClients} клиентов` : "Клиенты не найдены"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название/Имя</TableHead>
                  <TableHead>БИН/ИИН</TableHead>
                  <TableHead>Контакт</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Spinner />
                    </TableCell>
                  </TableRow>
                ) : (!clients || clients.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Клиенты не найдены.
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {client.name ||
                          `${client.last_name} ${client.first_name}`}
                      </TableCell>
                      <TableCell>{client.bin_iin}</TableCell>
                      <TableCell>
                        {`${client.last_name} ${client.first_name}`}
                      </TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Просмотр"
                            className="hover:bg-gray-100"
                            onClick={() => handleViewClick(client)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Редактировать"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleEditClick(client)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}

                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Удалить"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteClick(client)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Это действие приведет к удалению клиента. Эту операцию нельзя будет отменить.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setClientToDelete(null)}>Отмена</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteConfirm}>Удалить</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {totalClients > limit && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={Math.ceil(totalClients / limit)}
          onPageChange={handlePageChange}
        />
      )}

      {/* Modals */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Редактировать клиента" : "Создать нового клиента"}</DialogTitle>
            <DialogDescription>
              {editingClient ? "Внесите изменения в данные клиента." : "Заполните форму для создания нового клиента."}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Основная информация</h3>
                <Separator />
                <div>
                  <Label htmlFor="name">Название организации</Label>
                  <Input id="name" placeholder="Введите название организации..." value={clientFormData.name || ""} onChange={handleFormChange} />
                </div>
                <div>
                  <Label htmlFor="bin_iin">БИН/ИИН</Label>
                  <Input id="bin_iin" placeholder="Введите БИН/ИИН..." value={clientFormData.bin_iin || ""} onChange={handleFormChange} />
                </div>
                <div>
                  <Label htmlFor="address">Юридический адрес</Label>
                  <Textarea id="address" placeholder="Введите юридический адрес..." value={clientFormData.address || ""} onChange={handleFormChange} />
                </div>
                <div>
                  <Label htmlFor="contact_info">Контактная информация (юр.)</Label>
                  <Textarea id="contact_info" placeholder="Введите контактную информацию..." value={clientFormData.contact_info || ""} onChange={handleFormChange} />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Контактное лицо</h3>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="last_name">Фамилия</Label>
                    <Input id="last_name" placeholder="Введите фамилию..." value={clientFormData.last_name || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="first_name">Имя</Label>
                    <Input id="first_name" placeholder="Введите имя..." value={clientFormData.first_name || ""} onChange={handleFormChange} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="middle_name">Отчество</Label>
                  <Input id="middle_name" placeholder="Введите отчество..." value={clientFormData.middle_name || ""} onChange={handleFormChange} />
                </div>
                <div>
                  <Label htmlFor="iin">ИИН</Label>
                  <Input id="iin" placeholder="Введите ИИН..." value={clientFormData.iin || ""} onChange={handleFormChange} />
                </div>
                <div>
                  <Label htmlFor="id_number">№ удостоверения личности</Label>
                  <Input id="id_number" placeholder="Введите № удостоверения..." value={clientFormData.id_number || ""} onChange={handleFormChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="passport_series">Серия паспорта</Label>
                    <Input id="passport_series" placeholder="Введите серию паспорта..." value={clientFormData.passport_series || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="passport_number">Номер паспорта</Label>
                    <Input id="passport_number" placeholder="Введите номер паспорта..." value={clientFormData.passport_number || ""} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Телефон</Label>
                    <Input id="phone" placeholder="Введите телефон..." value={clientFormData.phone || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Введите Email..." value={clientFormData.email || ""} onChange={handleFormChange} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="registration_address">Адрес прописки</Label>
                  <Textarea id="registration_address" placeholder="Введите адрес прописки..." value={clientFormData.registration_address || ""} onChange={handleFormChange} />
                </div>
                <div>
                  <Label htmlFor="actual_address">Адрес фактического проживания</Label>
                  <Textarea id="actual_address" placeholder="Введите адрес проживания..." value={clientFormData.actual_address || ""} onChange={handleFormChange} />
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Отмена</Button>
            <Button onClick={handleSubmit}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!viewingClient} onOpenChange={(isOpen) => !isOpen && setViewingClient(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingClient?.name || `${viewingClient?.last_name} ${viewingClient?.first_name}`}</DialogTitle>
            <DialogDescription>Детальная информация о клиенте</DialogDescription>
          </DialogHeader>
          {viewingClient && (
            <ScrollArea className="max-h-[70vh] p-4">
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Основная информация</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Название" value={viewingClient.name} />
                    <DetailItem label="БИН/ИИН" value={viewingClient.bin_iin} />
                    <DetailItem label="Адрес" value={viewingClient.address} />
                    <DetailItem label="Контактная информация" value={viewingClient.contact_info} />
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Контактное лицо</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Фамилия" value={viewingClient.last_name} />
                    <DetailItem label="Имя" value={viewingClient.first_name} />
                    <DetailItem label="Отчество" value={viewingClient.middle_name} />
                    <DetailItem label="ИИН" value={viewingClient.iin} />
                    <DetailItem label="№ удостоверения" value={viewingClient.id_number} />
                    <DetailItem label="Серия паспорта" value={viewingClient.passport_series} />
                    <DetailItem label="Номер паспорта" value={viewingClient.passport_number} />
                    <DetailItem label="Телефон" value={viewingClient.phone} />
                    <DetailItem label="Email" value={viewingClient.email} />
                    <DetailItem label="Адрес прописки" value={viewingClient.registration_address} />
                    <DetailItem label="Адрес проживания" value={viewingClient.actual_address} />
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingClient(null)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}