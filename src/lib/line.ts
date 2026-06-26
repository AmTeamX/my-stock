// LINE Messaging API helpers

const LINE_API_BASE = 'https://api.line.me/v2';

function getChannelAccessToken(): string {
  return process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
}

export async function pushMessage(
  userId: string,
  messages: any[]
): Promise<boolean> {
  const token = getChannelAccessToken();
  if (!token) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN not set');
    return false;
  }

  try {
    const response = await fetch(`${LINE_API_BASE}/bot/message/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: userId,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('LINE push message error:', err);
      return false;
    }

    return true;
  } catch (error) {
    console.error('LINE push message failed:', error);
    return false;
  }
}

export async function multicastMessage(
  userIds: string[],
  messages: any[]
): Promise<boolean> {
  const token = getChannelAccessToken();
  if (!token) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN not set');
    return false;
  }

  try {
    const response = await fetch(`${LINE_API_BASE}/bot/message/multicast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: userIds,
        messages,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('LINE multicast error:', err);
      return false;
    }

    return true;
  } catch (error) {
    console.error('LINE multicast failed:', error);
    return false;
  }
}

export async function getProfile(userId: string): Promise<{
  displayName: string;
  userId: string;
  pictureUrl?: string;
} | null> {
  const token = getChannelAccessToken();
  if (!token) return null;

  try {
    const response = await fetch(
      `${LINE_API_BASE}/bot/profile/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export function buildLowStockFlexMessage(
  itemName: string,
  remaining: number,
  unit: string,
  threshold: number
): any[] {
  return [
    {
      type: 'flex',
      altText: `⚠️ ${itemName} ใกล้หมด! เหลือ ${remaining} ${unit}`,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '⚠️ แจ้งเตือนStockใกล้หมด',
              weight: 'bold',
              size: 'md',
              color: '#ffffff',
              align: 'center',
            },
          ],
          backgroundColor: '#FF6B6B',
        },
        body: {
          type: 'box',
          layout: 'vertical',
          spacing: 'md',
          contents: [
            {
              type: 'text',
              text: itemName,
              weight: 'bold',
              size: 'xl',
              wrap: true,
            },
            {
              type: 'box',
              layout: 'vertical',
              spacing: 'sm',
              contents: [
                {
                  type: 'text',
                  text: `📦 คงเหลือ: ${remaining} ${unit}`,
                  size: 'md',
                  wrap: true,
                },
                {
                  type: 'text',
                  text: `🔻 จำนวนขั้นต่ำ: ${threshold} ${unit}`,
                  size: 'md',
                  color: '#FF6B6B',
                  wrap: true,
                },
              ],
            },
            {
              type: 'text',
              text: 'กรุณาสั่งซื้อเพิ่มโดยเร็ว 🛒',
              size: 'sm',
              color: '#888888',
              wrap: true,
            },
          ],
        },
      },
    },
  ];
}

export function buildTransactionConfirmMessage(
  itemName: string,
  quantity: number,
  unit: string,
  remaining: number
): string {
  return `✅ เบิก ${itemName}\nจำนวน: ${quantity} ${unit}\nคงเหลือ: ${remaining} ${unit}`;
}
