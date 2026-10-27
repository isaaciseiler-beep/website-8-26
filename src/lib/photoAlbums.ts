export const R2_BASE = "https://pub-9c24f6ce599b4e09bac5241fc8f8beb0.r2.dev";

export type Continent = "Asia" | "Europe" | "Oceania" | "North America";

/** Newer uploads live in the 8-26-website-update bucket. */
export const R2_BASE_ALT = "https://pub-5f3b061447bb446f9d4529f2affeb05d.r2.dev";

export interface Album {
  folder: string;
  location: string;
  continent: Continent;
  /** Optional override when the album lives in a different R2 bucket. */
  baseUrl?: string;
  /** Include an HDR original when it is the only uploaded version. */
  includeHdr?: boolean;
  photos: string[];
}

export const albums: Album[] = [
  {
    folder: "Australia",
    location: "Australia",
    continent: "Oceania",
    photos: [
      "0A11C1BC-21C6-43B3-B8BF-B29F49E9DA0E_1_102_o.jpeg",
      "31BD9D74-3C9D-422D-8ACC-C8C0D36BC60B_1_102_o.jpeg",
      "32FF4002-49FB-44CA-8359-68014CC2BED2_1_102_o.jpeg",
      "5F22A2FD-2ED7-4912-AD2D-CE9A2CDF57FF_1_105_c.jpeg",
      "8D85EC7A-2958-4742-A57E-091A02BD5578_1_102_o.jpeg",
      "95F6DDF7-2BA1-49D7-9B1B-DCCC82707D3E_1_102_o.jpeg",
      "AD5D60F2-50B0-459D-AB71-A107A7DB4D5D_1_102_o.jpeg",
      "E21FE61C-AD00-4CBB-AD6B-A339DCB02362_1_102_o.jpeg",
      "E9BD2085-8F0B-42A6-B83D-5EB471D2FE17_1_105_c.jpeg",
      "F043169E-CC8D-46CA-8DAA-6FB16A1D975C_1_102_o.jpeg",
    ],
  },
  {
    folder: "GranCanaria",
    location: "Canary Islands",
    continent: "Europe",
    photos: [
      "143292ED-2DD1-40EC-9629-122BB5F1F83D_1_105_c.jpeg",
      "33ECDECB-3F14-4390-9329-B4D3943B1020_1_105_c.jpeg",
      "6A5CF7DA-4350-440A-8634-5911B798E37A_1_105_c.jpeg",
      "75945001-4213-49A3-8C50-36D28380019D_1_105_c.jpeg",
      "7804EC72-30A3-4304-B190-543356E7147F_1_105_c.jpeg",
      "79D58238-ED8F-4512-BF58-902C9D07AC01_1_105_c.jpeg",
      "94B0B284-5AFA-4A7E-8202-E62EEAD4423F_1_105_c.jpeg",
      "9D99C905-11BA-4A6F-957F-701ED5312E02_1_105_c.jpeg",
      "9F96FDA9-2B24-4527-ADD6-0637BAAB210A_1_105_c.jpeg",
      "C601FFA3-B4DF-4B87-856B-01225F1C33F9_1_105_c.jpeg",
    ],
  },
  {
    folder: "HongKong",
    location: "Hong Kong",
    continent: "Asia",
    photos: [
      "0DB78A6E-A136-4224-8880-E388B1210176_1_105_c.jpeg",
      "11E6F5EE-31F4-488C-A5F4-A9E359D871E7_1_105_c.jpeg",
      "16A99DE7-3E6E-43DF-A766-3472559552ED_1_102_o.jpeg",
      "4770996E-87B7-400D-A982-E7B000868FFE_1_105_c.jpeg",
      "5331D0EC-1B61-4297-A6B8-7D5D26BD7F39_1_105_c.jpeg",
      "94338AFF-132A-4B29-A750-D88EAFB1CCA7_1_105_c.jpeg",
      "A7976C84-44F8-413A-A95E-B422CDCFC680_1_105_c.jpeg",
      "ABE128E5-11D3-4699-97F7-6963424A2D55_1_105_c.jpeg",
      "B07FA064-E275-49CA-9F8C-2BDABE655426_1_105_c.jpeg",
      "D3E118C8-5349-4E22-8FB3-344315CFCC4E_1_102_o.jpeg",
    ],
  },
  {
    folder: "Iceland",
    location: "Iceland",
    continent: "Europe",
    photos: [
      "08A53489-8059-4F7F-8167-319D7B461198_1_105_c.jpeg",
      "1BDB063A-F6AE-4219-AD4E-6A9D28D13E87_1_105_c.jpeg",
      "25CEC2B8-36D1-4C61-AE32-EFABD4D941C4_1_105_c.jpeg",
      "397AE8BE-DA75-400E-AD53-EDA94FF8609A_1_105_c.jpeg",
      "66CA6345-4382-4D12-8ECC-2765C3C3021F_1_105_c.jpeg",
      "676A2111-4821-48DD-AB7C-62E81988DE1C_1_105_c.jpeg",
      "78A46E0A-DFCF-47AA-98D8-202E395864AD_1_105_c.jpeg",
      "82303EE8-2410-428D-A033-441353883FCF_1_105_c.jpeg",
      "8340C3C0-46E4-4E05-A76C-D5C7D755AF25_1_105_c.jpeg",
      "8F8D1071-0D68-4FFD-91BA-5627053B60B5_1_105_c.jpeg",
      "C331A5CF-F997-4DF4-A3B4-99653758586D_1_105_c.jpeg",
      "C348C098-E910-4407-B0EE-57A0A3482CFD_1_105_c.jpeg",
      "CEE43906-E7A6-43CD-9F24-131C649FC92A_1_105_c.jpeg",
      "EDE80FC3-8B5F-4493-9D91-D4ED4A8098FC_1_105_c.jpeg",
      "F534EE42-A57E-476F-BC8B-5293D3447169_1_105_c.jpeg",
    ],
  },
  {
    folder: "Indonesia",
    location: "Indonesia",
    continent: "Oceania",
    photos: [
      "15F558C5-1BEC-44B0-871B-4FF3453EB6F6_1_102_o.jpeg",
      "3E3E1FB0-419E-448A-8CF3-A70F337C6707_1_102_o.jpeg",
      "84D5A7B4-5451-4B8F-873E-CBF9F23A6E46_1_102_o.jpeg",
      "ABCF0558-3934-4495-BF8E-0E952787CDE2_1_102_o.jpeg",
      "B709BAFC-602A-4660-BB69-B8F1220CEE0B_1_102_o.jpeg",
      "E1FF2232-D5EE-4D5D-825C-A4F7D4CDDD38_1_105_c.jpeg",
    ],
  },
  {
    folder: "Japan",
    location: "Japan",
    continent: "Asia",
    photos: [
      "0CE879E6-54A1-4B97-98C6-1C0F3FEF8BDF_1_105_c.jpeg",
      "200AEFC0-B899-4B61-BBEA-6E9815A1FC22_1_105_c.jpeg",
      "2F3815DA-F447-40A7-A855-BD73C11CD07F_1_105_c.jpeg",
      "A26033D9-D208-4123-94DC-247074386B43_1_105_c.jpeg",
      "ADDA8E28-EBAA-4095-AD47-E75CF3860361_1_102_o.jpeg",
      "B1E4ACD8-45FA-406E-8F31-B6F7088B4F2C_1_105_c.jpeg",
      "BC97E19F-3F27-490C-9875-846F11F4272E_1_105_c.jpeg",
      "D6A6EC02-3BB4-430B-8988-C7595162CBF0_1_105_c.jpeg",
      "D988EE3F-E9F6-4B44-83F5-4FBA51CA9CB4_1_102_o.jpeg",
      "DC528591-AED5-4AB0-9666-3849B5EEFAAC_1_105_c.jpeg",
    ],
  },
  {
    folder: "Korea",
    location: "Korea",
    continent: "Asia",
    photos: [
      "13A2219F-815C-4DDD-AD61-C5306996EFF1_1_105_c.jpeg",
      "4974120B-C8FB-41B9-88FA-89FCB824378A_1_105_c.jpeg",
      "69D12E1F-B752-4FEE-A5F2-F1F69BF4C513_1_105_c.jpeg",
      "7DB94195-F8BA-45C2-BCCF-A1598BBFDEBA_1_105_c.jpeg",
      "A32F2F15-BCA2-4CBD-B0D5-C973A6A8AE40_1_105_c.jpeg",
      "B015BAFE-8CBC-4D79-BC76-3508C315FF65_1_105_c.jpeg",
      "C9234731-C513-4B6D-B79A-7FB7716F4B3A_1_105_c.jpeg",
      "DBEAA05C-25AD-4BAB-95BF-0011BD882DA8_1_105_c.jpeg",
      "DCFCC257-C1FF-4C8C-B55C-409684F20A42_1_105_c.jpeg",
      "E91C855B-7264-4764-B482-20EEEDFEEA24_1_105_c.jpeg",
    ],
  },
  {
    folder: "NewZealand",
    location: "New Zealand",
    continent: "Oceania",
    photos: [
      "0CC3D909-B33D-4A8D-8684-912DD95550E8_1_105_c.jpeg",
      "188F099D-FCAB-44DC-AFC7-10989C2F440D_1_105_c.jpeg",
      "1B15B1B6-4AB3-485F-A024-66190FF40455_1_105_c.jpeg",
      "1C8FE555-57E0-4096-9226-2DD580FE77CC_1_105_c.jpeg",
      "1EF095B1-0947-40C5-9364-3D552DD31D82_1_105_c.jpeg",
      "224E5E48-0638-4CAB-B34B-2C58CE18EB2D_1_105_c.jpeg",
      "390604EB-865F-4267-83C8-41EE0B31D21D_1_105_c.jpeg",
      "56CCACFD-967F-452B-8EE7-2F6DA9BBF776_1_105_c.jpeg",
      "6242A373-8333-4173-A96A-794658988F24_1_105_c.jpeg",
      "65214EF9-7BDA-4385-839E-7FA8DB68B671_1_105_c.jpeg",
      "66730C9E-A647-4C11-AAF2-4699D0B2B00E_1_105_c.jpeg",
      "685D9CFE-CE1C-4E4F-BF44-82EB7F8A2527_1_105_c.jpeg",
      "734B49FB-C11C-4122-8313-3A120DA893E1_1_105_c.jpeg",
      "77791024-F812-4097-9760-A88BFABD2E62_1_105_c.jpeg",
      "8C0216D7-B44D-4650-8DF9-5B38CB79DC18_1_105_c.jpeg",
      "BB1DE711-AC5F-447C-9A13-82F170BF7E60_1_105_c.jpeg",
      "BD84847D-C0CA-40BE-83DC-D36E11EBBCE9_1_105_c.jpeg",
      "C9ABDD38-F348-46FF-AFF0-4231E770E46F_1_105_c.jpeg",
      "E205710B-202D-45D5-9BBB-06AC7BF155D2_1_105_c.jpeg",
      "F39CEBF7-F371-4581-B535-DF7471B43362_1_105_c.jpeg",
    ],
  },
  {
    folder: "Portugal",
    location: "Portugal",
    continent: "Europe",
    photos: [
      "2CB47B2E-5C03-41B4-8449-53077A18AD83_1_105_c.jpeg",
      "3CE2F2C0-F9DB-446D-82EA-C51016065E40_1_105_c.jpeg",
      "8BE8D671-0B88-4DF7-B191-7997860C48DE_1_105_c.jpeg",
      "9A081BDE-6537-4C91-9441-1A4B03851A81_1_105_c.jpeg",
      "CC340844-A006-4382-BAE2-4E095F3DBC05_1_105_c.jpeg",
      "D28503DC-8568-4251-95E3-A7D024A6872E_1_105_c.jpeg",
      "E21EE386-10BC-430F-AC49-FD8E41145B71_1_105_c.jpeg",
      "EF33F7F6-4660-4A1B-942A-6CA878984A34_1_105_c.jpeg",
      "F083026A-7588-4F60-97F9-DD11C78F9E5D_1_105_c.jpeg",
    ],
  },
  {
    folder: "Taiwan",
    location: "Taiwan",
    continent: "Asia",
    photos: [
      "14BC8F70-A1CE-4D79-8FBE-665B57EB131F_1_105_c.jpeg",
      "2FFD2476-0D22-4807-8C5E-E7D1C21C6B83_1_105_c.jpeg",
      "4C91004E-F742-4994-AE32-5297C9E0AFD0_1_105_c.jpeg",
      "58804FE5-138F-4AA9-B322-E808875DF864_1_105_c.jpeg",
      "6DFD57E6-CF70-4571-9455-60EE7A0FFBCC_1_105_c.jpeg",
      "8586F94D-82A1-4D13-8C7C-25D5D3FFCFAD_1_105_c.jpeg",
      "8A0F3EEE-A0C1-4F44-951B-FC83E755112D_1_105_c.jpeg",
      "BEE81A9F-3384-4F0A-9801-8B64B4629848_1_105_c.jpeg",
      "C66E080D-0849-47AD-8F7D-7674B89FBC8A_1_105_c.jpeg",
      "D2F4C59D-1C57-47D0-8F4B-E63118DE1837_1_105_c.jpeg",
      "D911954A-465E-4BAC-A6EC-4A31837E1A5A_1_105_c.jpeg",
      "F92F599D-D241-46CB-A6D0-3187EE3E5A23_1_105_c.jpeg",
    ],
  },
  {
    folder: "TaiwanStrait",
    location: "Matsu",
    continent: "Asia",
    photos: [
      "0917A746-3DD9-48B6-8A99-41903821867D_1_105_c.jpeg",
      "18F8DABC-C2B8-45F7-836F-AF1E9E4753E4_1_105_c.jpeg",
      "2FDE17BF-DA57-44A6-BCF0-271620478215_1_105_c.jpeg",
      "57852282-F50E-4FD9-80F0-62CACA509B3A_1_105_c.jpeg",
      "6113B4B7-FD9A-4737-B111-B58888DE32D8_1_105_c.jpeg",
      "6A5DA770-949C-4A05-8638-2DB39F237DDC_1_105_c.jpeg",
      "7B2AB99B-A6EE-4B37-ABF7-3DDE38B0F39A_1_105_c.jpeg",
      "855ACDB8-DF48-4639-9D9D-18F0F588172F_1_105_c.jpeg",
      "A3032114-A259-451F-9FD1-AB9EEB45E143_1_105_c.jpeg",
      "AF3A789A-19DB-44C1-9531-312B0BCD3496_1_105_c.jpeg",
    ],
  },
  {
    folder: "Thailand",
    location: "Thailand",
    continent: "Asia",
    photos: [
      "377C5D25-0614-4C9F-91EB-D509D0738DC5_1_105_c.jpeg",
      "43D0AB5A-F6E4-4E34-88C4-7A7E0F005B87_1_105_c.jpeg",
      "4A3AFB8B-11C5-4A96-A64F-E11818689AA6_1_105_c.jpeg",
      "50EB08B0-CE77-4DAF-B133-E52C47550CD4_1_102_o.jpeg",
      "6E2C1761-BB0A-4086-AC48-A730E2EE9C19_1_102_o.jpeg",
      "9218D849-806D-4017-9181-7E962BC1CF6F_1_102_o.jpeg",
      "BB231F3A-3C2E-4EF0-92CC-E47C535A1940_1_102_a.jpeg",
      "E4EA2C98-E4CD-4343-A139-8825EDA4B87F_1_105_c.jpeg",
      "EC92F2EF-9724-4A6C-9DD6-B00612542344_1_105_c.jpeg",
    ],
  },
  {
    folder: "Vietnam",
    location: "Vietnam",
    continent: "Asia",
    photos: [
      "4ABE8E8C-0966-4ED6-BD8D-464389569B77_1_105_c.jpeg",
      "6922AA55-2554-41DB-9A5E-9F5FF5CCD7C1_1_105_c.jpeg",
      "893DAA99-125B-4A1E-88F3-8D0510C35C3B_1_105_c.jpeg",
      "E2B47120-5EB0-4D70-A055-A3E182072695_1_105_c.jpeg",
    ],
  },
  {
    folder: "kz-kyrgz",
    location: "Kazakhstan & Kyrgyzstan",
    continent: "Asia",
    baseUrl: R2_BASE_ALT,
    photos: [
      "084E90AE-5E4B-4982-BE65-5A9CEAA675A8_1_105_c.jpeg",
      "0C33B020-BA48-4D3A-B997-F7C54E663AC4_1_105_c.jpeg",
      "101AF367-26DC-427F-ABF7-C53A10F84B6E_1_105_c.jpeg",
      "1F1DCC54-4820-4B47-B0A7-AA8E26DEA42A_1_105_c.jpeg",
      "207BED5E-AD43-4C76-A2AE-BCC6C1320F9B_1_105_c.jpeg",
      "3A2F1C21-24FF-4C30-8760-F2D39C90693D_1_105_c.jpeg",
      "54152F96-BC29-4D27-B968-0F66E29A8EBD_1_105_c.jpeg",
      "54B47624-C0EB-4510-BCFC-D8BEDF2ECA00_1_105_c.jpeg",
      "62F809A3-1D3C-46D6-B426-677A62569BE9_1_105_c.jpeg",
      "6885E1DB-887E-4AA2-86AE-469C395E6082_1_105_c.jpeg",
      "6EC32056-7737-48E1-B814-42DB8DDE0DE6_1_105_c.jpeg",
      "7EC2B093-B35C-41C3-9CC6-8BC7F89249C3_1_105_c.jpeg",
      "ACCCDEC5-6D00-4906-A519-169CEFF80EC0_1_105_c.jpeg",
      "B8D64A7A-15E3-451C-B292-7354F30CA834_1_105_c.jpeg",
      "BDD55F2F-4981-4FD4-B4D7-8A31A5935F1F_1_105_c.jpeg",
      "BEA5AF98-79AE-41FE-A0C5-5305EE996ABF_1_105_c.jpeg",
      "D2C0A5FB-324A-423C-8014-584836D9036F_1_105_c.jpeg",
      "DAEF1AB2-74D1-403D-ACA7-913C755E26F6_1_105_c.jpeg",
      "EBE88181-5749-44DA-9762-FB0F204BB774_1_105_c.jpeg",
      "F6AA09D3-248D-44D8-8765-3A35E943136C_1_105_c.jpeg",
    ],
  },
  {
    folder: "mongolia",
    location: "Mongolia",
    continent: "Asia",
    baseUrl: R2_BASE_ALT,
    photos: [
      "020599DB-E50F-4BC0-938C-DF65427B2390_1_105_c.jpeg",
      "04689A44-8451-4CBB-BEE1-1C158F85E8E5_1_105_c.jpeg",
      "44F39F19-60CC-40D1-8E57-898077F2C386_1_105_c.jpeg",
      "4664BB00-F505-4AD1-A6D9-3945E5CDAD46_1_105_c.jpeg",
      "4B59D059-DAEE-483B-8CDD-971010279B5D_1_105_c.jpeg",
      "5CA65493-F75A-44D2-87C7-C41A39F05D96_1_105_c.jpeg",
      "AAE65C44-CC8B-4549-AB3B-7241FB7F6873_1_105_c.jpeg",
      "AB9D42F7-DE88-4670-8E7B-D20ED15C4D2B_1_105_c.jpeg",
      "C6B51EAB-E1B5-4005-B433-DD569D49CB62_1_105_c.jpeg",
      "C6F9F3A3-0E08-463A-BBF8-420B83ED16DF_1_105_c.jpeg",
      "CCA30A98-0658-4F31-9EA5-D5F15BD3E5F1_1_105_c.jpeg",
      "D18B1A76-E64F-4E4D-8BFA-C7450655FD72_1_105_c.jpeg",
      "E7C7D20D-2601-44E2-A929-C6D0CBEE66BE_1_105_c.jpeg",
      "ED393BD4-BF2F-4B1C-AC22-5AB953417443_1_105_c.jpeg",
      "F449F5FE-7D21-4A32-9D29-E7918C387B6F_1_105_c.jpeg",
    ],
  },
  {
    folder: "washington-state",
    location: "Washington State",
    continent: "North America",
    baseUrl: R2_BASE_ALT,
    photos: [
      "04FF5F75-E934-40BC-AE04-FDCB8E88F3BE_1_105_c.jpeg",
      "05083044-E263-4DF0-81D8-285F43AFAC65_1_105_c.jpeg",
      "0839E20A-90DE-4B82-A2ED-42C2ED9ACBE5_1_105_c.jpeg",
      "736976DE-C98A-4697-AB17-D8C9E0416209_1_105_c.jpeg",
      "7BE8EA00-0432-4CE4-BD5D-43C00FC31ADC_1_105_c.jpeg",
      "917FE91C-7316-4180-B534-4DFC4508394A_1_105_c.jpeg",
      "C0499536-625B-47BE-B6D3-38CD853AEA17_1_105_c.jpeg",
      "C14F0CFB-9E10-46AF-9286-57D2D6A82034_1_105_c.jpeg",
      "CFAD673F-9913-4CA6-831F-E808E2862A5A_1_105_c.jpeg",
      "D7B11F72-5197-4AC2-9247-AE7D4C643AC4_1_105_c.jpeg",
      "EB544320-8DC0-49F1-AD85-AFB395EF7FBF_1_105_c.jpeg",
    ],
  },
  {
    folder: "british-columbia",
    location: "British Columbia",
    continent: "North America",
    baseUrl: R2_BASE_ALT,
    includeHdr: true,
    photos: [
      "B5958A86-47D3-45B0-949A-7A88C5754112_1_105_c.jpeg",
      "DB7510D5-FE38-4631-A851-8E782BEDEE12_1_105_c.jpeg",
      "E7DB3662-010B-4805-81D4-23BD42B45C9A_1_105_c.jpeg",
      "1651174A-249C-43DF-B4F2-20AD1DCE0427_1_201_a.jpeg",
    ],
  },
];

export const photoUrl = (folder: string, file: string, base: string = R2_BASE) =>
  `${base}/${folder}/${file}`;

export const isHdrPhotoFile = (file: string) => /_1_201_a\.(jpe?g|png|webp)$/i.test(file);

export const albumPhotoFiles = (album: Album) => album.photos.filter((file) => album.includeHdr || !isHdrPhotoFile(file));

export const albumPhotos = (album: Album) =>
  albumPhotoFiles(album).map((f) => photoUrl(album.folder, f, album.baseUrl));

export const coverFor = (album: Album) =>
  photoUrl(album.folder, albumPhotoFiles(album)[0] ?? album.photos[0], album.baseUrl);

// Curated picks: one image per album for home preview & featured tiles.
export const curatedPicks = albums.map((a) => ({
  location: a.location,
  url: coverFor(a),
}));
