import { config } from '../config';

const API_BASE_URL = config.api.baseUrl;

// At the top of api.ts, add this line
console.log('API BASE URL is:', 'http://YOUR_ACTUAL_IP:5001');


export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export const api = {
  async convertImageToSmiles(image: File): Promise<ApiResponse<{ smiles: string; ic50: string }>> {
    const formData = new FormData();
    formData.append('image', image);

    try {
      const response = await fetch(`${API_BASE_URL}/image-to-smiles`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: 'Failed to convert image to SMILES' };
    }
  },

  async convertMolToSmiles(molBlock: string): Promise<ApiResponse<{ smiles: string; ic50: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/mol-to-smiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mol: molBlock }),
      });
      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: 'Failed to convert MOL to SMILES' };
    }
  },

  // 🔥 여기 수정 (ic50을 number 타입으로)
  // async submitScore(nickname: string, smiles: string, ic50: number): Promise<ApiResponse<{ message: string; leaderboard: any[] }>> {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/submit-score`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ nickname, smiles, ic50 }),
  //     });
  //     const data = await response.json();
  //     return { data };
  //   } catch (error) {
  //     return { error: 'Failed to submit score' };
  //   }
  // },

  async submitScore(nickname: string, smiles: string, ic50: number): Promise<ApiResponse<{ message: string; leaderboard: any[] }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/submit-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname, smiles, ic50 }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        return { error: errorData.error || 'Failed to submit score' };
      }
      
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Submit error:', error);
      return { error: 'Failed to submit score' };
    }
  },


  // async getLeaderboard(): Promise<ApiResponse<{ leaderboard: any[] }>> {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/leaderboard`);
  //     const data = await response.json();
  //     return { data };
  //   } catch (error) {
  //     return { error: 'Failed to fetch leaderboard' };
  //   }
  // },

  async getLeaderboard(): Promise<ApiResponse<{ leaderboard: any[] }>> {
    try {
      console.log('Attempting to fetch from:', API_BASE_URL + '/leaderboard');
      const response = await fetch(`${API_BASE_URL}/leaderboard`);
      console.log('Response status:', response.status);
      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Detailed fetch error:', error);
      return { error: 'Failed to fetch leaderboard' };
    }
  }

};
