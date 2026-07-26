const fs = require('fs');
let code = fs.readFileSync('apps/server/src/modules/media/routes.ts', 'utf8');

const importMiddleware = `import { authMiddleware, optionalAuthMiddleware, AuthRequest } from "../../middleware/auth.js";`;
code = code.replace(/import \{ authMiddleware, AuthRequest \} from "\.\.\/\.\.\/middleware\/auth\.js";/, importMiddleware);

// Replace the GET /:id route declaration!
code = code.replace(/router\.get\("\/:id", async \(req: Request, res: Response\) => \{/, `
router.get("/:id", optionalAuthMiddleware, async (req: AuthRequest, res: Response) => {
`);

const fetchUserEntry = `
        let userEntry = null;
        if (req.userId) {
            userEntry = await prisma.diaryEntry.findFirst({
                where: { userId: req.userId, mediaId: id },
                orderBy: { watchedDate: "desc" }
            });
        }
        
        // Build normalized response
`;

code = code.replace(/        \/\/ Build normalized response/, fetchUserEntry);

const JSONReturn = `        res.json({
            ...media,
            userEntry,
            movieMetadata: undefined,
            tvShowMetadata: undefined,
            youtubeMetadata: undefined,
            songMetadata: undefined,
            metadata,
        });`;

code = code.replace(/        res\.json\(\{\n            \.\.\.media,[\s\S]*?metadata,\n        \}\);/, JSONReturn);

fs.writeFileSync('apps/server/src/modules/media/routes.ts', code);
